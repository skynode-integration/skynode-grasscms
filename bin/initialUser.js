use grasshopper-demo;

db.users.insert({
    role: 'admin',
    enabled: true,
    firstname: 'Test',
    lastname: 'User',
    identities: {
        basic: {
            username: 'admin',
            salt: '225384010328',
            hash: '885f59a76ea44e1d264f9da45ca83574fbe55e3e7e6c51afe681730b45c7bb03'
        }
    },
    displayName : 'admin',
    linkedIdentities : ['basic'],
    email: 'email@email.com'
});
