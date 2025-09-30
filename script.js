        let entries = [];
        let currentFilter = 'all';
        let editingId = null;
        let nextId = 1;

        document.addEventListener('DOMContentLoaded', function() {
            loadFromLocalStorage();
            updateSummary();
            renderEntries();
            setupEventListeners();
        });

        function setupEventListeners() {
            document.getElementById('entryForm').addEventListener('submit', handleSubmit);
            const filterRadios = document.querySelectorAll('input[name="filter"]');
            filterRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    currentFilter = this.value;
                    renderEntries();
                });
            });
        }

        function handleSubmit(e) {
            e.preventDefault();
            
            const formData = {
                description: document.getElementById('description').value.trim(),
                amount: parseFloat(document.getElementById('amount').value),
                type: document.getElementById('type').value,
                category: document.getElementById('category').value.trim() || 'General',
                date: new Date().toLocaleDateString('en-IN')
            };

            if (!formData.description || !formData.amount || !formData.type) {
                alert('Please fill in all required fields!');
                return;
            }

            if (formData.amount <= 0) {
                alert('Amount must be greater than 0!');
                return;
            }

            if (editingId) {
                updateEntry(editingId, formData);
                cancelEdit();
            } else {
                createEntry(formData);
            }

            resetForm();
            updateSummary();
            renderEntries();
            saveToLocalStorage();
        }

        function createEntry(data) {
            const entry = {
                id: nextId++,
                ...data,
                createdAt: new Date().toISOString()
            };
            entries.unshift(entry); 
        }

        function updateEntry(id, data) {
            const index = entries.findIndex(entry => entry.id === id);
            if (index !== -1) {
                entries[index] = {
                    ...entries[index],
                    ...data,
                    updatedAt: new Date().toISOString()
                };
            }
        }

        function deleteEntry(id) {
            if (confirm('Are you sure you want to delete this entry?')) {
                entries = entries.filter(entry => entry.id !== id);
                updateSummary();
                renderEntries();
                saveToLocalStorage();
            }
        }

        function editEntry(id) {
            const entry = entries.find(e => e.id === id);
            if (!entry) return;

            document.getElementById('description').value = entry.description;
            document.getElementById('amount').value = entry.amount;
            document.getElementById('type').value = entry.type;
            document.getElementById('category').value = entry.category;

            editingId = id;
            document.getElementById('formTitle').textContent = 'Edit Entry';
            document.getElementById('submitBtn').textContent = 'Update Entry';
            document.getElementById('editIndicator').style.display = 'block';
            document.getElementById('cancelEditBtn').style.display = 'inline-block';
            document.getElementById('formSection').classList.add('edit-mode');

            document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
        }

        function cancelEdit() {
            editingId = null;
            document.getElementById('formTitle').textContent = 'Add New Entry';
            document.getElementById('submitBtn').textContent = 'Add Entry';
            document.getElementById('editIndicator').style.display = 'none';
            document.getElementById('cancelEditBtn').style.display = 'none';
            document.getElementById('formSection').classList.remove('edit-mode');
            resetForm();
        }

        function resetForm() {
            document.getElementById('entryForm').reset();
            document.getElementById('description').focus();
        }

        function updateSummary() {
            const totals = entries.reduce((acc, entry) => {
                if (entry.type === 'income') {
                    acc.income += entry.amount;
                } else {
                    acc.expenses += entry.amount;
                }
                return acc;
            }, { income: 0, expenses: 0 });

            const balance = totals.income - totals.expenses;

            document.getElementById('totalIncome').textContent = formatCurrency(totals.income);
            document.getElementById('totalExpenses').textContent = formatCurrency(totals.expenses);
            document.getElementById('netBalance').textContent = formatCurrency(balance);

            const balanceCard = document.getElementById('balanceCard');
            if (balance < 0) {
                balanceCard.classList.add('negative');
            } else {
                balanceCard.classList.remove('negative');
            }
        }

        function renderEntries() {
            const entriesList = document.getElementById('entriesList');
            const filteredEntries = getFilteredEntries();

            if (filteredEntries.length === 0) {
                entriesList.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                        </svg>
                        <h3>No ${currentFilter === 'all' ? 'transactions' : currentFilter} found</h3>
                        <p>${currentFilter === 'all' ? 'Start by adding your first income or expense entry!' : `No ${currentFilter} entries to display.`}</p>
                    </div>
                `;
                return;
            }

            entriesList.innerHTML = filteredEntries.map(entry => `
                <div class="entry-item ${entry.type}" data-id="${entry.id}">
                    <div class="entry-details">
                        <div class="entry-description">${entry.description}</div>
                        <div class="entry-meta">
                            <span>📁 ${entry.category}</span>
                            <span>📅 ${entry.date}</span>
                        </div>
                    </div>
                    <div class="entry-amount ${entry.type}">
                        ${entry.type === 'income' ? '+' : '-'}${formatCurrency(entry.amount)}
                    </div>
                    <div class="entry-actions">
                        <button class="btn-sm btn-edit" onclick="editEntry(${entry.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-sm btn-delete" onclick="deleteEntry(${entry.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function getFilteredEntries() {
            if (currentFilter === 'all') {
                return entries;
            }
            return entries.filter(entry => entry.type === currentFilter);
        }

        function formatCurrency(amount) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(amount);
        }

        function saveToLocalStorage() {
            try {
                const data = {
                    entries: entries,
                    nextId: nextId
                };
                
                const jsonData = JSON.stringify(data);
                localStorage.setItem('incomeExpenseData', jsonData);
            } catch (error) {
                console.error('Error saving data:', error);
                alert('Could not save data. Your browser may have localStorage disabled or storage quota exceeded.');
            }
        }

        function loadFromLocalStorage() {
            try {
                const savedData = localStorage.getItem('incomeExpenseData');
                
                if (savedData) {
                    const data = JSON.parse(savedData);
                    entries = data.entries || [];
                    nextId = data.nextId || 1;
                } else {
                    entries = [];
                    nextId = 1;
                }
            } catch (error) {
                entries = [];
                nextId = 1;
                alert('Could not load saved data. Starting with empty data.');
            }
        }

        function addSampleData() {
            const sampleEntries = [
                { id: 1, description: 'Salary', amount: 50000, type: 'income', category: 'Job', date: new Date().toLocaleDateString('en-IN') },
                { id: 2, description: 'Groceries', amount: 2500, type: 'expense', category: 'Food', date: new Date().toLocaleDateString('en-IN') },
                { id: 3, description: 'Freelance Work', amount: 15000, type: 'income', category: 'Business', date: new Date().toLocaleDateString('en-IN') },
                { id: 4, description: 'Electricity Bill', amount: 1200, type: 'expense', category: 'Utilities', date: new Date().toLocaleDateString('en-IN') }
            ];
            
            entries = sampleEntries;
            nextId = 5;
            updateSummary();
            renderEntries();
        }
