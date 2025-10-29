// ============================================================================
// GENERATION OPTIMIZER
// High-performance parallel generation system with caching and streaming
// ============================================================================

class GenerationOptimizer {
    constructor() {
        this.cacheVersion = '1.0';
        this.progressCallback = null;
    }

    // ========================================================================
    // 1. TEXT PREPROCESSING
    // ========================================================================

    /**
     * Clean and normalize text
     */
    cleanText(text) {
        return text
            .replace(/\r\n/g, '\n')  // Normalize line endings
            .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
            .replace(/[ \t]+/g, ' ')  // Normalize spaces
            .replace(/<[^>]+>/g, '')  // Remove HTML tags
            .trim();
    }

    /**
     * Calculate optimal chunk size based on text length
     */
    calculateOptimalChunkSize(textLength) {
        const words = textLength / 5; // Rough estimate: 5 chars per word

        if (words < 2000) {
            return { chunks: 1, wordsPerChunk: words };
        } else if (words < 5000) {
            return { chunks: 2, wordsPerChunk: Math.ceil(words / 2) };
        } else if (words < 10000) {
            return { chunks: 4, wordsPerChunk: Math.ceil(words / 4) };
        } else {
            return { chunks: 6, wordsPerChunk: Math.ceil(words / 6) };
        }
    }

    /**
     * Split text into overlapping chunks at semantic boundaries
     */
    intelligentChunk(text, targetWordsPerChunk) {
        const paragraphs = text.split(/\n\n+/);
        const chunks = [];
        let currentChunk = [];
        let currentWords = 0;
        const overlapSize = Math.floor(targetWordsPerChunk * 0.2); // 20% overlap

        for (const paragraph of paragraphs) {
            const paragraphWords = paragraph.split(/\s+/).length;

            if (currentWords + paragraphWords > targetWordsPerChunk && currentChunk.length > 0) {
                // Save current chunk
                chunks.push(currentChunk.join('\n\n'));

                // Start new chunk with overlap from previous chunk
                const overlapParagraphs = [];
                let overlapWords = 0;

                for (let i = currentChunk.length - 1; i >= 0; i--) {
                    const words = currentChunk[i].split(/\s+/).length;
                    if (overlapWords + words <= overlapSize) {
                        overlapParagraphs.unshift(currentChunk[i]);
                        overlapWords += words;
                    } else {
                        break;
                    }
                }

                currentChunk = overlapParagraphs;
                currentWords = overlapWords;
            }

            currentChunk.push(paragraph);
            currentWords += paragraphWords;
        }

        // Add final chunk
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n\n'));
        }

        return chunks.length > 0 ? chunks : [text];
    }

    /**
     * Preprocess notes into optimized chunks
     */
    preprocessNotes(notesText) {
        this.updateProgress('Preprocessing notes...', 5);

        const cleaned = this.cleanText(notesText);
        const { chunks: numChunks, wordsPerChunk } = this.calculateOptimalChunkSize(cleaned.length);

        console.log(`📝 Preprocessing: ${cleaned.length} chars → ${numChunks} chunks (~${wordsPerChunk} words each)`);

        if (numChunks === 1) {
            return [cleaned];
        }

        const chunkedText = this.intelligentChunk(cleaned, wordsPerChunk);

        console.log(`✂️ Created ${chunkedText.length} chunks with overlap`);
        return chunkedText;
    }

    // ========================================================================
    // 2. PARALLEL GENERATION
    // ========================================================================

    /**
     * Generate study cards for a single chunk
     */
    async generateStudyCardsForChunk(chunkText, chunkIndex, totalChunks, options) {
        const { language, languageInstruction, model } = options;

        this.updateProgress(`Generating study cards: chunk ${chunkIndex + 1}/${totalChunks}...`, 10 + (chunkIndex / totalChunks * 40));

        const payload = {
            userId: options.userId,
            isPro: options.isPro,
            text: chunkText,
            model: model,
            language: language,
            languageInstruction: languageInstruction,
            isChunk: totalChunks > 1,
            chunkIndex: chunkIndex,
            totalChunks: totalChunks
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

            const response = await fetch('https://quizapp2-eight.vercel.app/api/generate-study-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
                throw new Error(error.error || error.message || `Server error (${response.status})`);
            }

            const data = await response.json();
            console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} complete:`, data.studyCardCount, 'study cards,', data.testCardCount, 'test cards');

            return {
                success: true,
                chunkIndex,
                studyCards: data.studyCards || [],
                testCards: data.testCards || [],
                studyCardCount: data.studyCardCount || 0,
                testCardCount: data.testCardCount || 0
            };
        } catch (error) {
            console.error(`❌ Chunk ${chunkIndex + 1}/${totalChunks} failed:`, error);
            return {
                success: false,
                chunkIndex,
                error: error.message,
                studyCards: [],
                testCards: []
            };
        }
    }

    /**
     * Generate study cards in parallel for all chunks
     */
    async generateStudyCardsParallel(chunks, options) {
        console.log(`🚀 Starting parallel generation for ${chunks.length} chunks...`);

        const startTime = Date.now();
        const promises = chunks.map((chunk, index) =>
            this.generateStudyCardsForChunk(chunk, index, chunks.length, options)
        );

        const results = await Promise.all(promises);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const successCount = results.filter(r => r.success).length;

        console.log(`⏱️ Parallel generation complete in ${duration}s (${successCount}/${chunks.length} successful)`);

        return results;
    }

    // ========================================================================
    // 3. POST-PROCESSING & MERGING
    // ========================================================================

    /**
     * Calculate text similarity using word overlap (simple but effective)
     */
    calculateSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));

        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    /**
     * Check if two study cards are similar enough to merge
     */
    areCardsSimilar(card1, card2, threshold = 0.7) {
        const topic1 = card1.topic || card1.term || card1.title || '';
        const topic2 = card2.topic || card2.term || card2.title || '';

        const content1 = card1.content || card1.definition || card1.description || '';
        const content2 = card2.content || card2.definition || card2.description || '';

        const topicSimilarity = this.calculateSimilarity(topic1, topic2);
        const contentSimilarity = this.calculateSimilarity(content1, content2);

        // Weight topic similarity more heavily
        const combinedSimilarity = (topicSimilarity * 0.6) + (contentSimilarity * 0.4);

        return combinedSimilarity >= threshold;
    }

    /**
     * Merge two similar study cards
     */
    mergeCards(card1, card2) {
        // Keep the longer/more detailed content
        const content1 = card1.content || card1.definition || card1.description || '';
        const content2 = card2.content || card2.definition || card2.description || '';

        const mergedContent = content1.length >= content2.length ? content1 : content2;

        return {
            ...card1,
            content: mergedContent,
            topic: card1.topic || card2.topic,
            // Preserve other fields from card1 by default
            _mergedFrom: [card1.id || 'chunk1', card2.id || 'chunk2']
        };
    }

    /**
     * Deduplicate and merge similar study cards
     */
    deduplicateCards(cards, threshold = 0.7) {
        this.updateProgress('Merging overlapping concepts...', 55);

        const merged = [];
        const used = new Set();

        for (let i = 0; i < cards.length; i++) {
            if (used.has(i)) continue;

            let currentCard = cards[i];

            // Find all similar cards
            for (let j = i + 1; j < cards.length; j++) {
                if (used.has(j)) continue;

                if (this.areCardsSimilar(currentCard, cards[j], threshold)) {
                    currentCard = this.mergeCards(currentCard, cards[j]);
                    used.add(j);
                }
            }

            merged.push(currentCard);
            used.add(i);
        }

        const dedupedCount = cards.length - merged.length;
        console.log(`🔗 Deduplicated ${dedupedCount} cards (${cards.length} → ${merged.length})`);

        return merged;
    }

    /**
     * Rebuild parent-child hierarchy after merging
     */
    rebuildHierarchy(cards) {
        this.updateProgress('Rebuilding hierarchy...', 65);

        // Assign indices to cards
        cards.forEach((card, index) => {
            card._index = index;
        });

        // First pass: identify root cards (no parent)
        cards.forEach(card => {
            if (card.parentIndex === undefined || card.parentIndex === null || card.parentIndex === -1) {
                card.level = 0;
                card.parentIndex = null;
            }
        });

        // Second pass: rebuild levels based on parent relationships
        let maxIterations = 10;
        let changed = true;

        while (changed && maxIterations > 0) {
            changed = false;
            maxIterations--;

            cards.forEach((card, index) => {
                if (card.parentIndex !== null && card.parentIndex !== undefined) {
                    const parent = cards[card.parentIndex];
                    if (parent && parent.level !== undefined) {
                        const expectedLevel = parent.level + 1;
                        if (card.level !== expectedLevel) {
                            card.level = expectedLevel;
                            changed = true;
                        }
                    }
                }
            });
        }

        // Fix orphaned or invalid parent references
        cards.forEach((card, index) => {
            if (card.parentIndex !== null) {
                if (card.parentIndex >= cards.length || card.parentIndex === index) {
                    // Invalid parent reference
                    card.parentIndex = null;
                    card.level = 0;
                }
            }
        });

        console.log(`🌳 Hierarchy rebuilt: ${cards.filter(c => c.level === 0).length} root nodes`);

        return cards;
    }

    /**
     * Merge results from all chunks
     */
    mergeChunkResults(results) {
        this.updateProgress('Merging all chunks...', 50);

        const allStudyCards = [];
        const allTestCards = [];

        results.forEach(result => {
            if (result.success) {
                allStudyCards.push(...result.studyCards);
                allTestCards.push(...result.testCards);
            }
        });

        console.log(`📦 Collected ${allStudyCards.length} study cards, ${allTestCards.length} test cards from ${results.length} chunks`);

        // Deduplicate study cards
        const dedupedStudyCards = this.deduplicateCards(allStudyCards, 0.7);

        // Rebuild hierarchy
        const finalStudyCards = this.rebuildHierarchy(dedupedStudyCards);

        return {
            studyCards: finalStudyCards,
            testCards: allTestCards,
            studyCardCount: finalStudyCards.length,
            testCardCount: allTestCards.length
        };
    }

    // ========================================================================
    // 4. CACHING SYSTEM
    // ========================================================================

    /**
     * Generate cache key from note files
     */
    async generateCacheKey(noteFiles) {
        // Create a deterministic string from note files
        const cacheInput = noteFiles.map(f => `${f.id}:${f.title}:${f.content}`).join('||');

        // Generate SHA-256 hash
        const encoder = new TextEncoder();
        const data = encoder.encode(cacheInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Sanitize version for Firebase (replace dots with underscores)
        const sanitizedVersion = this.cacheVersion.replace(/\./g, '_');

        return `gen_v${sanitizedVersion}_${hashHex}`;
    }

    /**
     * Get cached results (check localStorage first, then Firebase)
     */
    async getCachedResults(cacheKey, userId) {
        // Check localStorage first (instant)
        const localCache = localStorage.getItem(cacheKey);
        if (localCache) {
            try {
                const parsed = JSON.parse(localCache);
                console.log('💾 Cache hit (localStorage):', cacheKey);
                return parsed;
            } catch (e) {
                console.warn('Failed to parse localStorage cache:', e);
            }
        }

        // Check Firebase (slower)
        if (window.db && userId) {
            try {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
                const cacheRef = ref(window.db, `cache/${userId}/${cacheKey}`);
                const snapshot = await get(cacheRef);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    // Also save to localStorage for faster future access
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                    console.log('💾 Cache hit (Firebase):', cacheKey);
                    return data;
                }
            } catch (e) {
                console.warn('Failed to check Firebase cache:', e);
            }
        }

        console.log('❌ Cache miss:', cacheKey);
        return null;
    }

    /**
     * Save results to cache (both localStorage and Firebase)
     */
    async setCachedResults(cacheKey, data, userId) {
        // Save to localStorage
        try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
            console.log('💾 Saved to localStorage cache:', cacheKey);
        } catch (e) {
            console.warn('Failed to save to localStorage (quota exceeded?):', e);
        }

        // Save to Firebase
        if (window.db && userId) {
            try {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
                const cacheRef = ref(window.db, `cache/${userId}/${cacheKey}`);
                await set(cacheRef, {
                    ...data,
                    cachedAt: Date.now(),
                    version: this.cacheVersion
                });
                console.log('💾 Saved to Firebase cache:', cacheKey);
            } catch (e) {
                console.warn('Failed to save to Firebase cache:', e);
            }
        }
    }

    /**
     * Invalidate cache for a project
     */
    async invalidateCache(projectId, userId) {
        // Clear all cache entries that start with gen_v prefix in localStorage
        const sanitizedVersion = this.cacheVersion.replace(/\./g, '_');
        const cachePrefix = `gen_v${sanitizedVersion}`;

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(cachePrefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        console.log(`🗑️ Invalidated ${keysToRemove.length} cache entries from localStorage`);

        // Note: Firebase cache can remain, as it's content-based (will naturally become stale)
    }

    // ========================================================================
    // 5. PROGRESS TRACKING
    // ========================================================================

    /**
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Update progress
     */
    updateProgress(message, percent) {
        console.log(`📊 Progress: ${percent}% - ${message}`);
        if (this.progressCallback) {
            this.progressCallback(message, percent);
        }
    }

    // ========================================================================
    // 6. MAIN GENERATION ORCHESTRATOR
    // ========================================================================

    /**
     * Generate study cards and test cards with full optimization
     */
    async generateOptimized(selectedNoteFiles, options) {
        const startTime = Date.now();

        try {
            // Step 1: Check cache
            this.updateProgress('Checking cache...', 0);
            const cacheKey = await this.generateCacheKey(selectedNoteFiles);
            const cached = await this.getCachedResults(cacheKey, options.userId);

            if (cached) {
                this.updateProgress('Loading from cache...', 100);
                return {
                    ...cached,
                    fromCache: true,
                    duration: (Date.now() - startTime) / 1000
                };
            }

            // Step 2: Preprocess notes
            const notesText = selectedNoteFiles.map(note => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = note.content || '';
                const plainText = tempDiv.textContent || tempDiv.innerText || '';
                return `# ${note.title}\n\n${plainText}`;
            }).join('\n\n---\n\n');

            const chunks = this.preprocessNotes(notesText);

            // Step 3: Parallel generation
            const results = await this.generateStudyCardsParallel(chunks, options);

            // Check if all chunks failed
            if (results.every(r => !r.success)) {
                throw new Error('All generation chunks failed. Please try again.');
            }

            // Step 4: Merge and post-process
            const merged = this.mergeChunkResults(results);

            // Step 5: Save to cache
            this.updateProgress('Saving to cache...', 95);
            await this.setCachedResults(cacheKey, merged, options.userId);

            this.updateProgress('Complete!', 100);

            const duration = (Date.now() - startTime) / 1000;
            console.log(`✨ Generation complete in ${duration.toFixed(2)}s`);

            return {
                ...merged,
                fromCache: false,
                duration,
                chunksProcessed: chunks.length,
                successfulChunks: results.filter(r => r.success).length
            };

        } catch (error) {
            console.error('❌ Generation failed:', error);
            throw error;
        }
    }
}

// Export as singleton
window.GenerationOptimizer = GenerationOptimizer;
window.generationOptimizer = new GenerationOptimizer();
