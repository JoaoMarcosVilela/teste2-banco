const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'accounts.json');

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Inicializar arquivo de dados se não existir
if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        accounts: [
            { id: 1, name: "João Silva", balance: 1000, transactions: [] },
            { id: 2, name: "Maria Souza", balance: 5000, transactions: [] }
        ]
    }));
}

// Ler dados
function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Escrever dados
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Rotas da API
app.get('/api/accounts', (req, res) => {
    const data = readData();
    res.json(data.accounts);
});

app.get('/api/accounts/:id', (req, res) => {
    const data = readData();
    const account = data.accounts.find(acc => acc.id === parseInt(req.params.id));
    if (account) {
        res.json(account);
    } else {
        res.status(404).json({ error: 'Conta não encontrada' });
    }
});

app.post('/api/accounts', (req, res) => {
    const data = readData();
    const newAccount = {
        id: data.accounts.length > 0 ? Math.max(...data.accounts.map(acc => acc.id)) + 1 : 1,
        name: req.body.name,
        balance: 0,
        transactions: []
    };
    data.accounts.push(newAccount);
    writeData(data);
    res.status(201).json(newAccount);
});

app.post('/api/accounts/:id/deposit', (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valor inválido' });
    }

    const data = readData();
    const accountIndex = data.accounts.findIndex(acc => acc.id === parseInt(req.params.id));

    if (accountIndex === -1) {
        return res.status(404).json({ error: 'Conta não encontrada' });
    }

    data.accounts[accountIndex].balance += amount;
    data.accounts[accountIndex].transactions.push({
        type: 'deposit',
        amount,
        date: new Date().toISOString()
    });

    writeData(data);
    res.json(data.accounts[accountIndex]);
});

app.post('/api/accounts/:id/withdraw', (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valor inválido' });
    }

    const data = readData();
    const accountIndex = data.accounts.findIndex(acc => acc.id === parseInt(req.params.id));

    if (accountIndex === -1) {
        return res.status(404).json({ error: 'Conta não encontrada' });
    }

    if (data.accounts[accountIndex].balance < amount) {
        return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    data.accounts[accountIndex].balance -= amount;
    data.accounts[accountIndex].transactions.push({
        type: 'withdraw',
        amount,
        date: new Date().toISOString()
    });

    writeData(data);
    res.json(data.accounts[accountIndex]);
});

app.post('/api/accounts/:from/transfer/:to', (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valor inválido' });
    }

    const data = readData();
    const fromIndex = data.accounts.findIndex(acc => acc.id === parseInt(req.params.from));
    const toIndex = data.accounts.findIndex(acc => acc.id === parseInt(req.params.to));

    if (fromIndex === -1 || toIndex === -1) {
        return res.status(404).json({ error: 'Conta(s) não encontrada(s)' });
    }

    if (data.accounts[fromIndex].balance < amount) {
        return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Executar transferência
    data.accounts[fromIndex].balance -= amount;
    data.accounts[toIndex].balance += amount;

    // Registrar transações
    const now = new Date().toISOString();
    data.accounts[fromIndex].transactions.push({
        type: 'transfer_out',
        amount,
        to: data.accounts[toIndex].name,
        date: now
    });

    data.accounts[toIndex].transactions.push({
        type: 'transfer_in',
        amount,
        from: data.accounts[fromIndex].name,
        date: now
    });

    writeData(data);
    res.json({
        from: data.accounts[fromIndex],
        to: data.accounts[toIndex]
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor bancário rodando em http://localhost:${PORT}`);
});