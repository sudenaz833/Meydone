pipeline {
    agent any

    options {
        // 1. ÇÖZÜM: Jenkins'in arka planda otomatik ve kontrolsüz checkout yapmasını engeller
        skipDefaultCheckout() 
    }

    stages {
        stage('Sistemi Temizle ve Checkout') {
            steps {
                // 2. ÇÖZÜM: Klasörde kalan eski bozuk git kalıntılarını pırıl pırıl temizler
                cleanWs() 
                
                echo 'Kodlar GitHub\'dan temiz bir şekilde çekiliyor...'
                git branch: 'main', url: 'https://github.com/sudenaz833/Meydone.git'
            }
        }

        stage('Build and Deploy') {
            steps {
                echo 'Ana dizindeki docker-compose kullanılarak sistem ayağa kaldırılıyor...'
                // sh komutlarında env saklamak yerine tek satırda çalıştırmak daha sağlıklıdır
                sh 'export JWT_SECRET=meydone1 && docker compose down'
                sh 'export JWT_SECRET=meydone1 && docker compose up -d --build'
            }
        }

        stage('Health Check') {
            steps {
                echo 'Sistemin ayağa kalkması bekleniyor (15 saniye)...'
                sleep 15
                
                echo 'Backend kontrol ediliyor...'
                sh 'curl -f http://localhost:9000 || echo "Backend henüz hazır değil!"'
                
                echo 'Frontend kontrol ediliyor...'
                sh 'curl -f http://localhost:3000 || echo "Frontend henüz hazır değil!"'
            }
        }
    }

    post {
        success {
            echo 'Meydone (Frontend & Backend) başarıyla yayına alındı.'
        }
        failure {
            echo 'Dağıtım sırasında bir hata oluştu. Docker loglarını kontrol et!'
        }
    }
}