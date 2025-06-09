# Mathematical Sudoku

Mathematical Sudoku, klasik Sudoku bulmacasına matematiksel bir dokunuş katan, tarayıcı tabanlı bir oyundur. Oyuncular, boş hücreleri 1'den 9'a kadar rakamlarla doldururken, aynı zamanda her boş hücre için ipucu olarak verilen ikinci derece denklemleri çözerek doğru sayıyı bulmaya çalışırlar.

Oyun, farklı zorluk seviyeleri sunar:
*   **Easy (Kolay):** Tek bir 9x9 Sudoku tahtası.
*   **Medium (Orta):** İki adet 9x9 Sudoku tahtası.
*   **Hard (Zor):** Dört adet 9x9 Sudoku tahtası.

Çoklu tahta modlarında, tüm tahtaların doğru şekilde çözülmesi gerekir.

## Özellikler

*   **Dinamik Sudoku Üretimi:** Her yeni oyunda benzersiz Sudoku bulmacaları ve çözümleri oluşturulur.
*   **Matematiksel İpuçları:** Boş hücrelerin üzerine gelindiğinde, doğru sayıyı köklerinden biri olarak içeren ikinci derece denklemler ipucu olarak gösterilir.
*   **Çoklu Tahta Desteği:** Zorluk seviyesine göre artan sayıda eş zamanlı çözülecek Sudoku tahtası.
*   **Zorluk Seviyeleri:** Kolay, orta ve zor olmak üzere üç farklı zorluk seviyesi.
*   **Ayarlanabilir İpucu Sayısı:** Zorluk seviyesine göre değişen sayıda kullanılabilir "Get Hint" (İpucu Al) hakkı (Kolay: 3, Orta: 5, Zor: 8).
*   **Giriş Doğrulama:** Kullanıcı bir sayı girdiğinde, Sudoku kurallarına göre (satır, sütun, 3x3 kutu çakışması) anlık olarak hücrenin geçerliliği işaretlenir.
*   **Çözüm Kontrolü:** Oyuncular istedikleri zaman mevcut çözümlerini kontrol edebilirler. Doğru ve yanlış girişler görsel olarak vurgulanır.
*   **Oyun Durumu Kaydı:** Oyun durumu (mevcut bulmacalar, zamanlayıcı, kalan ipuçları) tarayıcının LocalStorage'ında saklanır, böylece oyuncular oyuna kaldıkları yerden devam edebilirler.
*   **Zamanlayıcı:** Oyuncuların bulmacayı çözme sürelerini takip etmeleri için bir zamanlayıcı.
*   **Duyarlı Tasarım (Temel):** Oyun arayüzü farklı ekran boyutlarına uyum sağlamaya çalışır.

## Oynanış

1.  **Zorluk Seçimi:** Oyun başladığında veya "New Game / Restart" butonuna tıklandığında bir zorluk seviyesi seçin.
2.  **Sayıları Yerleştirme:** Boş hücrelere tıklayarak 1'den 9'a kadar rakamları girin.
3.  **Matematiksel İpuçları:**
    *   Bir boş hücrenin üzerine fare imlecini getirdiğinizde, o hücredeki doğru sayıyı köklerinden biri olarak içeren bir ikinci derece denklem (örneğin, `x² - 5x + 6 = 0`) ipucu olarak görünecektir. Bu denklemi çözerek (`x=2` veya `x=3`) ve Sudoku kurallarını dikkate alarak doğru sayıyı bulabilirsiniz.
    *   Denklemler, sadece bir tane 1-9 arası pozitif tam sayı kökü olacak şekilde üretilmeye çalışılır.
4.  **"Get Hint" (İpucu Al) Butonu:**
    *   Takılırsanız, bu butona tıklayarak rastgele boş bir hücrenin doğru sayıyla doldurulmasını sağlayabilirsiniz.
    *   Kullanılabilir ipucu sayısı zorluk seviyesine göre değişir.
5.  **Giriş Doğrulaması:**
    *   Bir hücreye sayı girdiğinizde, eğer bu sayı aynı satırda, sütunda veya 3x3'lük kutuda başka bir sayıyla çakışıyorsa, hücre kırmızı bir arka planla işaretlenir. Bu, çözümün doğruluğunu değil, sadece o anki yerleşimin Sudoku kurallarına uygunluğunu gösterir.
6.  **"Check Solution" (Çözümü Kontrol Et) Butonu:**
    *   Tüm hücreleri doldurduğunuzu düşündüğünüzde veya ilerlemenizi kontrol etmek istediğinizde bu butona tıklayın.
    *   Doğru girilen sayılar yeşil, yanlış girilenler veya boş bırakılanlar kırmızı renkte kısa bir süre yanıp sönecektir.
    *   Tüm tahtalar doğru ve eksiksiz çözüldüğünde bir tebrik mesajı alırsınız ve zamanlayıcı durur.
7.  **Zamanlayıcı:**
    *   "Start Timer" butonu ile zamanlayıcıyı başlatabilirsiniz.
    *   Oyun tamamlandığında veya yeni bir oyun başlatıldığında zamanlayıcı sıfırlanır/durur.
    *   Oyun durumu kaydedildiğinde zamanlayıcının mevcut durumu da kaydedilir.
8.  **"New Game / Restart" (Yeni Oyun / Yeniden Başlat) Butonu:** Mevcut oyunu sıfırlar ve seçili zorluk seviyesine göre yeni bir oyun başlatır. LocalStorage'daki mevcut oyun kaydını siler.

## Kurulum ve Çalıştırma

Bu oyun tamamen istemci taraflıdır (HTML, CSS, JavaScript) ve herhangi bir sunucu tarafı bileşen gerektirmez.

1.  **Dosyaları İndirin:** Bu projenin tüm dosyalarını (`index.html`, `style.css`, `script.js`) bilgisayarınıza indirin ve aynı klasörde tutun.
2.  **Tarayıcıda Açın:** `index.html` dosyasına çift tıklayarak veya bir web tarayıcısında açarak oyunu başlatabilirsiniz.

Herhangi bir derleme veya bağımlılık kurulumu gerekmez.

## Dosya Yapısı

*   `index.html`: Oyunun ana HTML yapısı ve arayüz elemanları.
*   `style.css`: Oyunun görsel stilleri, tahta düzeni, renkler ve animasyonlar.
*   `script.js`: Tüm oyun mantığı, Sudoku üretimi, ipucu mekanizması, DOM manipülasyonu ve olay yönetimi.

## Geliştirme Notları

*   Kod, okunabilirliği ve sürdürülebilirliği artırmak için JavaScript sınıfları (`SudokuGame`, `UIManager`, `StorageManager`, `Timer`, `HintManager`, `SudokuUtils`) kullanılarak modüler bir yapıda organize edilmiştir.
*   Sabit değerler ve yapılandırma ayarları `CONSTANTS` nesnesinde merkezi olarak yönetilir.
*   Hata yönetimi ve konsol logları geliştirme sürecine yardımcı olmak için eklenmiştir.

---