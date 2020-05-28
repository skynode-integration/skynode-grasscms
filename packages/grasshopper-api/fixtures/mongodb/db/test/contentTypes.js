module.exports = function(ObjectID) {
    'use strict';

    return [
        {
            _id: ObjectID('524362aa56c02c0703000001'),
            label: 'This is my test content type',
            helpText: '',
            slug: 'contenttype-slug',
            description: '',
            fields: [
                {
                    _id: 'testfield',
                    type: 'textbox',
                    label: 'Title',
                    validation: [
                        {
                            type : 'alpha',
                            options : {
                                min : 5,
                                max : 10
                            }
                        }
                    ]
                },
                {
                    _id: 'numfield',
                    type: 'textbox',
                    label: 'Num Field',
                    validation: [
                        {
                            type : 'number',
                            options : {
                                min : 5,
                                max : 10
                            }
                        }
                    ]
                },
                {
                    _id: 'alphanumfield',
                    type: 'textbox',
                    label: 'AlphaNum Field',
                    validation: [
                        {
                            type : 'alpha_numeric',
                            options : {
                                min : 5,
                                max : 10
                            }
                        }
                    ]
                },
                {
                    _id: 'emailfield',
                    type: 'textbox',
                    label: 'Email Field',
                    validation: [
                        {
                            type : 'email'
                        }
                    ]
                },{
                    _id: 'uniquefield1',
                    type: 'textbox',
                    label: 'Globally Unique Field',
                    validation: [
                        {
                            type : 'unique',
                            options: {
                                property: 'fields.uniquefield1'
                            }
                        }
                    ]
                },{
                    _id: 'uniquefield2',
                    type: 'textbox',
                    label: 'Unique Field For Specific Content Type',
                    validation: [
                        {
                            type : 'unique',
                            options: {
                                property: 'fields.uniquefield2',
                                contentTypes: ['524362aa56c02c0703000001']
                            }
                        }
                    ]
                }
            ]
        },
        {
            _id: ObjectID('5254908d56c02c076e000001'),
            label: 'Users',
            description: 'Protected content type that defines users in the system.',
            helpText: 'These fields are the minimum required to create a user in the system. See more about extending users through plugins.',
            fields: {
                login: {
                    label: 'Login',
                    type: 'textbox'
                },
                name: {
                    label: 'Name',
                    type: 'textbox'
                },
                email: {
                    label: 'Email',
                    type: 'textbox'
                },
                role: {
                    label: 'Role',
                    type: 'dropdown',
                    required: true,
                    options: [
                        { _id: 'reader', val: 'Reader' },
                        { _id: 'author', val: 'Author' },
                        { _id: 'editor', val: 'Editor' },
                        { _id: 'admin', val: 'Admin' },
                        { _id: 'none', val: 'None' }
                    ]
                },
                password: {
                    label: 'Email',
                    type: 'password'
                },
                enabled: {
                    label: 'Enabled',
                    type: 'checkbox'
                }
            },
            meta: [],
            protected: true
        }

    ];
};