const path = require('path');
const mongoose = require('mongoose');
const redis = require('redis');
const express = require('express');
const jwt = require('jsonwebtoken');

// --- 0. MODELİ İÇERİ AL (Burası önemli!) ---
// Kullanici modelinin olduğu dosya yolunu kendi projeninkine göre düzelt kanki
// Örn: const Kullanici = require('./models/User'); 

// 1. AYARLAR
process.env.JWT_SECRET = 'meydone-ozel-gizli-anahtar-123'; 
const app = express();
app.use(express.json());

// 2. REDIS BAĞLANTISI
const redisClient = redis.createClient();
redisClient.on("error", (err) => console.log("❌ Redis Hatası:", err));
redisClient.on("connect", () => console.log("✅ Redis Bağlantısı Kuruldu!"));

(async () => {
    await redisClient.connect();
})();

// 3. KARA LİSTE KONTROLÜ (Middleware)
const tokenDogrula = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Token bulunamadı!" });

    try {
        const karaListedeMi = await redisClient.get(`bl_${token}`);
        if (karaListedeMi) {
            return res.status(401).json({ message: "Bu oturum kapatılmış! Lütfen tekrar giriş yapın." });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ message: "Geçersiz veya süresi dolmuş token!" });
            
            req.kullaniciID = decoded.kullaniciadi;
            req.tokenExp = decoded.exp; 
            req.token = token;
            next();
        });
    } catch (error) {
        res.status(500).json({ message: "Sistem hatası!" });
    }
};

// 4. ROTALAR

// --- KAYIT OL ---
app.post('/api/ceren/auth/register', async (req, res) => {
    try {
        const { kullaniciadi, sifre, eposta } = req.body;
        const varMi = await Kullanici.findOne({ kullaniciadi });
        if (varMi) return res.status(400).json({ message: "Bu kullanıcı zaten kayıtlı!" });

        const yeniKullanici = new Kullanici({ kullaniciadi, sifre, eposta });
        await yeniKullanici.save();
        res.status(201).json({ message: "Kayıt başarılı kanki!" });
    } catch (error) {
        res.status(500).json({ message: "Kayıt hatası!" });
    }
});

// --- GİRİŞ YAP ---
app.post('/api/ceren/auth/login', async (req, res) => {
    const { kullaniciadi, sifre } = req.body;
    
    // Veritabanından kontrol edelim
    const kullanici = await Kullanici.findOne({ kullaniciadi });
    if (!kullanici || kullanici.sifre !== sifre) {
        return res.status(401).json({ message: "Kullanıcı adı veya şifre yanlış!" });
    }

    const token = jwt.sign({ kullaniciadi }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: "Giriş başarılı", token });
});

// --- PROFİL GÜNCELLE VE KARA LİSTEYE AL (Test Noktası) ---
app.put('/api/sude/users/profile', tokenDogrula, async (req, res) => {
    try {
        // Burada DB güncelleme kodların olacak...
        
        // İşlem bitince mevcut token'ı Redis'e atıyoruz
        const tokenKey = `bl_${req.token}`;
        await redisClient.set(tokenKey, "iptal-edildi");
        await redisClient.expireAt(tokenKey, req.tokenExp);

        res.json({ message: `Sayın ${req.kullaniciID}, profil güncellendi. Güvenlik için çıkış yapıldı.` });
    } catch (err) {
        res.status(500).send("Güncelleme hatası.");
    }
});

// --- KONTROL ROTOSI ---
app.get('/', tokenDogrula, (req, res) => {
    res.send(`Hoş geldin ${req.kullaniciID}, şu an içeridesin!`);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} adresinde!`));