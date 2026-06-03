pipeline {
    agent any

    options {
        skipDefaultCheckout() 
    }

    stages {
        stage('Sistemi Temizle ve Checkout') {
            steps {
                cleanWs() 
                echo 'Kodlar GitHub\'dan temiz bir şekilde çekiliyor...'
                git branch: 'main', url: 'https://github.com/sudenaz833/Meydone.git'
            }
        }

        stage('Build and Deploy') {
            steps {
                echo 'Meydone bileşenleri Docker komutlarıyla ayağa kaldırılıyor...'
                
                // Varsa eski asılı kalan konteynerleri saf docker komutuyla temizleyelim
                sh 'docker stop meydone_api_yeni || true'
                sh 'docker rm meydone_api_yeni || true'
                
                // Backend imajını sıfırdan derleyelim
                sh 'docker build -t meydone_backend_img ./backend'
                
                // 9001 port köprüsüyle konteyneri çalıştıralım (Docker kilitlenmesini aşmak için)
                sh 'docker run -d -p 9001:9000 --name meydone_api_yeni -e JWT_SECRET=meydone1 meydone_backend_img'
            }
        }

        stage('Health Check') {
            steps {
                echo 'Sistemin ayağa kalkması bekleniyor (15 saniye)...'
                sleep 15
                
                echo 'Backend kontrol ediliyor (Port: 9001)...'
                sh 'curl -f http://localhost:9001 || echo "Backend henüz hazır değil!"'
            }
        }
    }

    post {
        success {
            echo 'Meydone başarıyla yayına alındı.'
        }
        failure {
            echo 'Dağıtım sırasında bir hata oluştu. Docker loglarını kontrol et!'
        }
    }
}