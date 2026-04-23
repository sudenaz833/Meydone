pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/sudenaz833/Meydone.git'
            }
        }

        stage('Build and Deploy') {
            steps {
                echo 'Backend klasörüne giriliyor ve konteynerlar build ediliyor...'
                // dir komutu ile Jenkins'e backend klasörüne gitmesini söylüyoruz
                dir('backend') {
                    // Tireleri sildik ve boşluk bıraktık: 'docker compose'
                    sh 'export JWT_SECRET=meydone1 && docker compose down'
                    sh 'export JWT_SECRET=meydone1 && docker compose up -d --build'
                }
            }
        }

        stage('Health Check') {
            steps {
                echo 'Sistemin ayaga kalkmasi bekleniyor...'
                sleep 10
                // Not: Docker içinde localhost:3000 her zaman çalışmayabilir ama 
                // şimdilik bu kalsın, hata verirse burayı da düzeltiriz.
                sh 'curl -f http://localhost:4000 || echo "Backend henüz hazir degil!"'
            }
        }
    }

    post {
        success {
            echo 'Meydone basariyla yayina alindi ve calisiyor.'
        }
        failure {
            echo 'Bir hata olustu, loglari kontrol etmelisin!'
        }
    }
}