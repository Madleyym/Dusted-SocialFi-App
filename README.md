# 🎮 Lasso Game Bot

Bot for automating daily play and claim in Lasso Game (Monad testnet).

> ℹ️ Note: If you don't want to use private key, you can use alternative bot in `/no-need-pk` directory instead.


## 🎮 Dusted Register
[➡️ Register here](https://www.dusted.app/?referralCode=F69QT9HL) to start playing!


## 🔥 Features
- Auto Play Lasso Game
- Auto Claim Daily Points
- Auto Check Score & Rank
- Random timing to avoid detection

## 🚀 Quick Start Guide

1. **Install Dependencies**
```bash
npm init -y
npm install ethers axios node-cron user-agents fs
```

2. **Setup Files**
```bash
# Create required files
touch bot.js token.txt pk.txt

# Set file permissions (for Linux/Mac)
chmod 600 token.txt pk.txt
```

3. **Fill Configuration Files**

`token.txt`:
```plaintext
PASTE_YOUR_BEARER_TOKEN_HERE
```

`pk.txt`:
```plaintext
PASTE_YOUR_PRIVATE_KEY_HERE
```

4. **Run Bot**
```bash
node bot.js
```

Bot will automatically:
- Check score & rank
- Play Lasso game
- Get claim signature
- Submit claim on-chain
- Repeat process daily on schedule

## ⚠️ Quick Troubleshooting

- **Game Error?** → Check remaining plays & game status
- **Claim Error?** → Check MONAD balance for gas
- **Score Error?** → Verify bearer token
- **Connection Error?** → Check internet and RPC endpoint