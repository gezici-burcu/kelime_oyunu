
    
        // Kelime dosyası yolu
        const WORDS_FILE = 'words.txt';

        let words = [];
        let currentWord = null;
        let score = 0;
        let currentWordIndex = 0;
        let usedWords = [];
        let hintShown = false;
        let remainingAttempts = 3;
        let totalScore = 0;
        let gamesPlayed = 0;

        // LocalStorage anahtarları
        const STORAGE_KEYS = {
            WORDS: 'kelimekavram_words',
            TOTAL_SCORE: 'kelimekavram_total_score',
            GAMES_PLAYED: 'kelimekavram_games_played'
        };

        // Veri yükleme ve kaydetme fonksiyonları
        function saveData() {
            try {
                localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
                localStorage.setItem(STORAGE_KEYS.TOTAL_SCORE, totalScore.toString());
                localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, gamesPlayed.toString());
            } catch (error) {
                console.error('Veri kaydedilemedi:', error);
            }
        }

        function loadData() {
            try {
                const savedWords = localStorage.getItem(STORAGE_KEYS.WORDS);
                if (savedWords) {
                    words = JSON.parse(savedWords);
                } else {
                    // İlk kez çalışıyorsa words.txt dosyasını yükle
                    loadWordsFromFile();
                }
                
                const savedTotalScore = localStorage.getItem(STORAGE_KEYS.TOTAL_SCORE);
                if (savedTotalScore) {
                    totalScore = parseInt(savedTotalScore) || 0;
                }
                
                const savedGamesPlayed = localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED);
                if (savedGamesPlayed) {
                    gamesPlayed = parseInt(savedGamesPlayed) || 0;
                }
                
                updateStats();
            } catch (error) {
                console.error('Veri yüklenemedi:', error);
                loadWordsFromFile(); // Hata durumunda dosyadan yükle
                totalScore = 0;
                gamesPlayed = 0;
            }
        }

        // Words.txt dosyasından kelimeleri yükle
        async function loadWordsFromFile() {
            try {
                const response = await fetch(WORDS_FILE);
                if (!response.ok) {
                    throw new Error(`Dosya yüklenemedi: ${response.status}`);
                }
                
                const text = await response.text();
                const lines = text.split('\n').filter(line => line.trim() !== '');
                words = []; // Mevcut kelimeleri temizle
                
                for (let line of lines) {
                    const parts = line.trim().split(/\s*-\s*/); // " - " ile ayır
                    
                    if (parts.length >= 2) {
                        const word = parts[0].trim();
                        const meaning = parts[1].trim();
                        const meanings = meaning.split(',').map(m => m.trim());
                        
                        words.push({ word, meaning, meanings });
                    } else {
                        console.warn('Format hatalı satır:', line);
                    }
                }
                
                saveData();
                updateStats();
                console.log(`${words.length} kelime words.txt dosyasından yüklendi!`);
                
                // Başarılı yükleme mesajı
                showLoadingStatus(`✅ ${words.length} kelime başarıyla yüklendi!`, 'success');
                
            } catch (error) {
                console.error('words.txt dosyası yüklenemedi:', error);
                words = [];
                updateStats();
                
                // Hata mesajı
                showLoadingStatus(`❌ words.txt dosyası yüklenemedi: ${error.message}`, 'error');
            }
        }
        
        // Yükleme durumu mesajı göster
        function showLoadingStatus(message, type) {
            // Geçici bir status div'i oluştur
            let statusDiv = document.getElementById('loadingStatus');
            if (!statusDiv) {
                statusDiv = document.createElement('div');
                statusDiv.id = 'loadingStatus';
                statusDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 10px 15px;
                    border-radius: 5px;
                    color: white;
                    font-weight: bold;
                    z-index: 1000;
                `;
                document.body.appendChild(statusDiv);
            }
            
            statusDiv.textContent = message;
            statusDiv.style.backgroundColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
            statusDiv.style.display = 'block';
            
            // 3 saniye sonra gizle
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }

        function updateStats() {
            document.getElementById('wordCount').textContent = words.length;
            document.getElementById('totalScore').textContent = totalScore;
            document.getElementById('gamesPlayed').textContent = gamesPlayed;
        }

        // Kelimeleri dışa aktarma
        function exportWords() {
            if (words.length === 0) {
                alert('Dışa aktarılacak kelime bulunamadı!');
                return;
            }
            
            let content = '';
            words.forEach(word => {
                content += `${word.word} - ${word.meaning}\n`;
            });
            
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kelimeler.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Oyunu başlat
        function startGame() {
            if (words.length === 0) {
                alert('Kelime bulunamadı!');
                return;
            }
            
            hideAllScreens();
            document.getElementById('gameArea').style.display = 'block';
            document.querySelector('.back-btn').style.display = 'block';
            
            usedWords = [];
            remainingAttempts = 3;
            score = 0;
            gamesPlayed++;
            saveData();
            updateScoreDisplay();
            updateAttemptsDisplay();
            nextWord();
        }

        // Sonraki kelime
        function nextWord() {
            if (words.length === 0) {
                document.getElementById('wordDisplay').textContent = 'Kelime bulunamadı!';
                return;
            }
            
            if (usedWords.length >= words.length) {
                totalScore += score;
                saveData();
                updateStats();
                alert(`Tüm kelimeler tamamlandı! Bu oyundaki skorunuz: ${score}`);
                showMenu();
                return;
            }
            
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * words.length);
            } while (usedWords.includes(randomIndex));
            
            currentWord = words[randomIndex];
            usedWords.push(randomIndex);
            hintShown = false;
            remainingAttempts = 3;
            
            // Rastgele olarak kelimeyi veya anlamını göster
            const showWord = Math.random() < 0.5;
            if (showWord) {
                document.getElementById('wordDisplay').textContent = currentWord.word;
                currentWord.questionType = 'meaning';
            } else {
                document.getElementById('wordDisplay').textContent = currentWord.meaning;
                currentWord.questionType = 'word';
            }
            
            document.getElementById('answerInput').value = '';
            document.getElementById('feedback').style.display = 'none';
            document.getElementById('hintDisplay').style.display = 'none';
            document.getElementById('wordCounter').textContent = `${usedWords.length}/${words.length}`;
            updateAttemptsDisplay();
            
            document.getElementById('answerInput').focus();
        }

        // Cevabı kontrol et
        function checkAnswer() {
            const userAnswer = document.getElementById('answerInput').value.trim().toLowerCase();
            if (!userAnswer) return;
            
            const feedback = document.getElementById('feedback');
            let isCorrect = false;
            
            if (currentWord.questionType === 'meaning') {
                for (let meaning of currentWord.meanings) {
                    const cleanMeaning = meaning.toLowerCase().trim();
                    if (userAnswer === cleanMeaning || 
                        cleanMeaning.includes(userAnswer) || 
                        userAnswer.includes(cleanMeaning)) {
                        isCorrect = true;
                        break;
                    }
                }
            } else {
                const cleanWord = currentWord.word.toLowerCase();
                if (userAnswer === cleanWord || 
                    cleanWord.includes(userAnswer) || 
                    userAnswer.includes(cleanWord)) {
                    isCorrect = true;
                }
            }
            
            if (isCorrect) {
                const bonusPoints = remainingAttempts === 3 ? 15 : remainingAttempts === 2 ? 10 : 5;
                feedback.textContent = `Doğru! +${bonusPoints} puan | Tam karşılık: ${currentWord.questionType === 'meaning' ? currentWord.meaning : currentWord.word}`;
                feedback.className = 'feedback correct';
                score += bonusPoints;
                
                setTimeout(() => {
                    nextWord();
                }, 3000);
            } else {
                remainingAttempts--;
                
                if (remainingAttempts > 0) {
                    feedback.textContent = `Yanlış! ${remainingAttempts} hakkınız kaldı. Tekrar deneyin.`;
                    feedback.className = 'feedback incorrect';
                    updateAttemptsDisplay();
                    document.getElementById('answerInput').value = '';
                    document.getElementById('answerInput').focus();
                } else {
                    feedback.textContent = `Hakkınız bitti! Doğru cevap: ${currentWord.questionType === 'meaning' ? currentWord.meaning : currentWord.word}`;
                    feedback.className = 'feedback incorrect';
                    score = Math.max(0, score - 5);
                    
                    setTimeout(() => {
                        nextWord();
                    }, 3000);
                }
            }
            
            feedback.style.display = 'block';
            updateScoreDisplay();
        }

        // İpucu göster
        function showHint() {
            if (hintShown) return;
            
            const hintDisplay = document.getElementById('hintDisplay');
            let hint;
            
            if (currentWord.questionType === 'meaning') {
                const firstMeaning = currentWord.meanings[0];
                hint = `İpucu: ${firstMeaning.substring(0, 2)}... (${currentWord.meanings.length > 1 ? currentWord.meanings.length + ' farklı anlam var' : '1 anlam'})`;
            } else {
                hint = `İpucu: ${currentWord.word.substring(0, 2)}...`;
            }
            
            hintDisplay.textContent = hint;
            hintDisplay.style.display = 'block';
            hintShown = true;
        }

        // Enter tuşu kontrolü
        function checkEnter(event) {
            if (event.key === 'Enter') {
                checkAnswer();
            }
        }

        // Tahmin hakkı güncelle
        function updateAttemptsDisplay() {
            document.getElementById('attemptsDisplay').textContent = remainingAttempts;
            const attemptsElement = document.querySelector('.attempts');
            
            if (remainingAttempts === 3) {
                attemptsElement.style.color = '#4CAF50';
            } else if (remainingAttempts === 2) {
                attemptsElement.style.color = '#FF9800';
            } else {
                attemptsElement.style.color = '#f44336';
            }
        }

        // Skor güncelle
        function updateScoreDisplay() {
            document.getElementById('scoreDisplay').textContent = score;
        }

        // Kelime listesini göster
        function showWordList() {
            hideAllScreens();
            document.getElementById('wordListArea').style.display = 'block';
            document.querySelector('.back-btn').style.display = 'block';
            
            const listDisplay = document.getElementById('wordListDisplay');
            const listWordCount = document.getElementById('listWordCount');
            
            listWordCount.textContent = words.length;
            listDisplay.innerHTML = '';
            
            if (words.length === 0) {
                listDisplay.innerHTML = '<div class="word-item">Henüz kelime eklenmemiş.</div>';
                return;
            }
            
            words.forEach((word, index) => {
                const div = document.createElement('div');
                div.className = 'word-item';
                div.innerHTML = `
                    <div class="word-content">
                        <strong>${word.word}</strong> - ${word.meaning}
                    </div>
                    <button class="delete-btn" onclick="deleteWord(${index})">Sil</button>
                `;
                listDisplay.appendChild(div);
            });
        }

        // Kelime silme
        function deleteWord(index) {
            if (confirm(`"${words[index].word}" kelimesini silmek istediğinizden emin misiniz?`)) {
                words.splice(index, 1);
                saveData();
                updateStats();
                showWordList(); // Listeyi yenile
            }
        }

        // Kelime ekleme ekranı
        function showAddWord() {
            hideAllScreens();
            document.getElementById('addWordArea').style.display = 'block';
            document.querySelector('.back-btn').style.display = 'block';
        }

        // Kelime silme ekranı
        function showDeleteWords() {
            hideAllScreens();
            document.getElementById('deleteWordsArea').style.display = 'block';
            document.querySelector('.back-btn').style.display = 'block';
            
            const listDisplay = document.getElementById('deleteWordListDisplay');
            const deleteWordCount = document.getElementById('deleteWordCount');
            
            deleteWordCount.textContent = words.length;
            listDisplay.innerHTML = '';
            
            if (words.length === 0) {
                listDisplay.innerHTML = '<div class="word-item">Henüz kelime eklenmemiş.</div>';
                return;
            }
            
            words.forEach((word, index) => {
                const div = document.createElement('div');
                div.className = 'word-item';
                div.innerHTML = `
                    <div class="word-content">
                        <strong>${word.word}</strong> - ${word.meaning}
                    </div>
                    <button class="delete-btn" onclick="deleteWordFromList(${index})">Sil</button>
                `;
                listDisplay.appendChild(div);
            });
        }

        // Kelime silme fonksiyonu (silme ekranından)
        function deleteWordFromList(index) {
            if (confirm(`"${words[index].word}" kelimesini silmek istediğinizden emin misiniz?`)) {
                words.splice(index, 1);
                saveData();
                updateStats();
                showDeleteWords(); // Listeyi yenile
            }
        }

        // Yeni kelime ekle
        function addNewWord() {
            const word = document.getElementById('newWordInput').value.trim();
            const meaning = document.getElementById('newWordMeaning').value.trim();
            
            if (!word || !meaning) {
                alert('Lütfen hem kelimeyi hem de anlamını girin!');
                return;
            }
            
            // Aynı kelime var mı kontrol et
            const existingIndex = words.findIndex(w => w.word.toLowerCase() === word.toLowerCase());
            if (existingIndex >= 0) {
                if (confirm('Bu kelime zaten mevcut. Güncellemek ister misiniz?')) {
                    const meanings = meaning.split(',').map(m => m.trim());
                    words[existingIndex] = { word, meaning, meanings };
                    saveData();
                    updateStats();
                    alert('Kelime güncellendi!');
                }
            } else {
                const meanings = meaning.split(',').map(m => m.trim());
                words.push({ word, meaning, meanings });
                saveData();
                updateStats();
                alert('Kelime başarıyla eklendi!');
            }
            
            document.getElementById('newWordInput').value = '';
            document.getElementById('newWordMeaning').value = '';

            // Yeni kelime eklendikten sonra otomatik olarak dosya indir:
            let content = '';
            words.forEach(w => {
                content += `${w.word} - ${w.meaning}\n`;
            });
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kelimeler_guncel.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Tüm verileri sıfırla
        function resetAllData() {
            if (confirm('Tüm kelimeler, skorlar ve istatistikler silinecek. Emin misiniz?')) {
                if (confirm('Bu işlem geri alınamaz! Son kez emin misiniz?')) {
                    try {
                        localStorage.removeItem(STORAGE_KEYS.WORDS);
                        localStorage.removeItem(STORAGE_KEYS.TOTAL_SCORE);
                        localStorage.removeItem(STORAGE_KEYS.GAMES_PLAYED);
                        
                        totalScore = 0;
                        gamesPlayed = 0;
                        score = 0;
                        
                        // Gömülü kelimeleri tekrar yükle
                        loadWordsFromFile();
                        
                        updateStats();
                        updateScoreDisplay();
                        
                        alert('Tüm veriler sıfırlandı ve kelimeler dosyadan yeniden yüklendi!');
                    } catch (error) {
                        console.error('Veri sıfırlama hatası:', error);
                        alert('Veriler sıfırlanırken hata oluştu!');
                    }
                }
            }
        }

        // Çıkış
        function exitGame() {
            if (confirm('Oyundan çıkmak istediğinizden emin misiniz?')) {
                // Oyun skorunu toplam skora ekle
                if (score > 0) {
                    totalScore += score;
                    saveData();
                }
                window.close();
            }
        }

        // Ana menüyü göster
        function showMenu() {
            // Oyun skorunu toplam skora ekle
            if (score > 0) {
                totalScore += score;
                saveData();
                updateStats();
            }
            
            hideAllScreens();
            document.getElementById('mainMenu').style.display = 'block';
            document.querySelector('.back-btn').style.display = 'none';
            remainingAttempts = 3;
            score = 0;
            updateScoreDisplay();
        }

        // Tüm ekranları gizle
        function hideAllScreens() {
            document.getElementById('mainMenu').style.display = 'none';
            document.getElementById('gameArea').style.display = 'none';
            document.getElementById('wordListArea').style.display = 'none';
            document.getElementById('addWordArea').style.display = 'none';
            document.getElementById('deleteWordsArea').style.display = 'none';
        }

        // Sayfa yüklendiğinde
        window.onload = function() {
            loadData();
            updateScoreDisplay();
            updateAttemptsDisplay();
            
            // Yükleme durumu mesajı
            showLoadingStatus('📚 Kelimeler yükleniyor...', 'info');
        };

        // Sayfa kapatılırken veri kaydet
        window.onbeforeunload = function() {
            if (score > 0) {
                totalScore += score;
                saveData();
            }
        };
    