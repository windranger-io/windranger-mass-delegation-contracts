# Off Chain

## API

## DB stuff

### Delegate Table

```sql=
Delegate (
INT index, 
CHAR(20) address, (PRIMARY KEY)
CHAR(20) token_address,
CHAR(20) delegator_address,
VARCHAR(MAX) proof,
BIGINT delegatedAmountorWeight,
BIGINT data_created_block,

)
```

### Delegator Table
```sql=
Delegator (
CHAR(20) address, (UNIQUE, PRIMARY KEY)
CHAR(20) token_address,
CHAR(32) trieRoot,
INT delegationType,
BIGINT data_created_block,
)
```

### Token Table
```sql=
Token (
CHAR(20) token_address, (UNIQUE, PRIMARY KEY)
CHAR(20) deployed_instance
)
```


### Update Trie