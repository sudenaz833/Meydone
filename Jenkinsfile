pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Kodları GitHub'dan çekiyoruz
                git branch: 'main', url: 'https://github.com/sudenaz833/Meydone.git'
            }
        }

        stage('Build and Deploy') {
            steps {
                echo 'Ana dizindeki docker-compose kullanılarak sistem ayağa kaldırılıyoor...'
                // Artık dir('backend') kullanmıyoruz çünkü docker-compose.yaml ana dizinde.
                // JWT_SECRET gibi değişkenleri komut satırından veya Jenkins Credentials içinden verebilirsiniz.
                sh 'export JWT_SECRET=meydone1 && docker compose down'
                sh 'export JWT_SECRET=meydone1 && docker compose up -d --build'
            }
        }

        stage('Health Check') {
            steps {
                echo 'Sistemin ayağa kalkması bekleniyor (15 saniye)...'
                sleep 15
                
                // Backend ve Frontend kontrolü
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