document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface
    const accountsSection = document.getElementById('accounts-section');
    const accountDetailsSection = document.getElementById('account-details');
    const accountsList = document.getElementById('accounts-list');
    const accountInfo = document.getElementById('account-info');
    const transactionsBody = document.getElementById('transactions-body');
    const refreshBtn = document.getElementById('refresh-accounts');
    const createAccountBtn = document.getElementById('create-account');
    const backToAccountsBtn = document.getElementById('back-to-accounts');
    const depositBtn = document.getElementById('deposit-btn');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const transferBtn = document.getElementById('transfer-btn');

    // Variáveis de estado
    let currentAccountId = null;

    // Event Listeners
    refreshBtn.addEventListener('click', loadAccounts);
    createAccountBtn.addEventListener('click', createNewAccount);
    backToAccountsBtn.addEventListener('click', () => {
        accountDetailsSection.classList.add('hidden');
        accountsSection.classList.remove('hidden');
    });

    depositBtn.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        if (amount && amount > 0) {
            deposit(currentAccountId, amount);
        } else {
            alert('Por favor, insira um valor válido para depósito.');
        }
    });

    withdrawBtn.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        if (amount && amount > 0) {
            withdraw(currentAccountId, amount);
        } else {
            alert('Por favor, insira um valor válido para saque.');
        }
    });

    transferBtn.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('transfer-amount').value);
        const toAccountId = parseInt(document.getElementById('transfer-to').value);
        if (amount && amount > 0 && toAccountId) {
            transfer(currentAccountId, toAccountId, amount);
        } else {
            alert('Por favor, insira valores válidos para transferência.');
        }
    });

    // Carregar contas ao iniciar
    loadAccounts();

    // Funções
    async function loadAccounts() {
        try {
            const response = await fetch('/api/accounts');
            const accounts = await response.json();
            displayAccounts(accounts);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
            alert('Erro ao carregar contas. Verifique o console para mais detalhes.');
        }
    }

    function displayAccounts(accounts) {
        accountsList.innerHTML = '';
        accounts.forEach(account => {
            const accountCard = document.createElement('div');
            accountCard.className = 'account-card';
            accountCard.innerHTML = `
                <h3>${account.name}</h3>
                <p>ID: ${account.id}</p>
                <p>Saldo: R$ ${account.balance.toFixed(2)}</p>
            `;
            accountCard.addEventListener('click', () => showAccountDetails(account.id));
            accountsList.appendChild(accountCard);
        });
    }

    async function showAccountDetails(accountId) {
        try {
            const response = await fetch(`/api/accounts/${accountId}`);
            const account = await response.json();
            
            currentAccountId = account.id;
            
            // Mostrar informações da conta
            accountInfo.innerHTML = `
                <h3>${account.name}</h3>
                <p>ID: ${account.id}</p>
                <p>Saldo: R$ ${account.balance.toFixed(2)}</p>
            `;
            
            // Mostrar transações
            displayTransactions(account.transactions);
            
            // Alternar seções
            accountsSection.classList.add('hidden');
            accountDetailsSection.classList.remove('hidden');
            
            // Limpar campos de entrada
            document.getElementById('deposit-amount').value = '';
            document.getElementById('withdraw-amount').value = '';
            document.getElementById('transfer-amount').value = '';
            document.getElementById('transfer-to').value = '';
        } catch (error) {
            console.error('Erro ao carregar detalhes da conta:', error);
            alert('Erro ao carregar detalhes da conta. Verifique o console para mais detalhes.');
        }
    }

    function displayTransactions(transactions) {
        transactionsBody.innerHTML = '';
        
        // Ordenar transações por data (mais recente primeiro)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Formatar data
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleString();
            
            // Determinar classe CSS baseada no tipo de transação
            let typeClass = '';
            let typeText = '';
            let details = '';
            
            switch(transaction.type) {
                case 'deposit':
                    typeClass = 'deposit';
                    typeText = 'Depósito';
                    break;
                case 'withdraw':
                    typeClass = 'withdraw';
                    typeText = 'Saque';
                    break;
                case 'transfer_in':
                    typeClass = 'transfer_in';
                    typeText = 'Transferência Recebida';
                    details = `De: ${transaction.from}`;
                    break;
                case 'transfer_out':
                    typeClass = 'transfer_out';
                    typeText = 'Transferência Enviada';
                    details = `Para: ${transaction.to}`;
                    break;
            }
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td class="${typeClass}">${typeText}</td>
                <td class="${typeClass}">R$ ${transaction.amount.toFixed(2)}</td>
                <td>${details}</td>
            `;
            
            transactionsBody.appendChild(row);
        });
    }

    async function createNewAccount() {
        const name = prompt('Digite o nome do titular da nova conta:');
        if (name) {
            try {
                const response = await fetch('/api/accounts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name })
                });
                
                const newAccount = await response.json();
                alert(`Conta criada com sucesso! ID: ${newAccount.id}`);
                loadAccounts();
            } catch (error) {
                console.error('Erro ao criar conta:', error);
                alert('Erro ao criar conta. Verifique o console para mais detalhes.');
            }
        }
    }

    async function deposit(accountId, amount) {
        try {
            const response = await fetch(`/api/accounts/${accountId}/deposit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount })
            });
            
            const updatedAccount = await response.json();
            showAccountDetails(updatedAccount.id);
        } catch (error) {
            console.error('Erro ao realizar depósito:', error);
            alert('Erro ao realizar depósito. Verifique o console para mais detalhes.');
        }
    }

    async function withdraw(accountId, amount) {
        try {
            const response = await fetch(`/api/accounts/${accountId}/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount })
            });
            
            const updatedAccount = await response.json();
            showAccountDetails(updatedAccount.id);
        } catch (error) {
            console.error('Erro ao realizar saque:', error);
            alert(error.message || 'Erro ao realizar saque. Verifique o console para mais detalhes.');
        }
    }

    async function transfer(fromAccountId, toAccountId, amount) {
        try {
            const response = await fetch(`/api/accounts/${fromAccountId}/transfer/${toAccountId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount })
            });
            
            const result = await response.json();
            showAccountDetails(fromAccountId);
        } catch (error) {
            console.error('Erro ao realizar transferência:', error);
            alert('Erro ao realizar transferência. Verifique o console para mais detalhes.');
        }
    }
});