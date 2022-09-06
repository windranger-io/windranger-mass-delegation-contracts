# Off Chain

## API

## DB stuff

### Delegatees (Table)

```sql=
CREATE TABLE delegatees (
    token_address CHAR(20),
    delegator_address CHAR(20),
    delegatee_address CHAR(20),
    proof VARCHAR,
    delegated_weight BIGINT,
    delegated_block_number BIGINT
);

CREATE UNIQUE INDEX delegatees_index
ON delegatees(
    token_address,
    delegator_address,
    delegatee_address
);

CREATE INDEX delegatees_index_delegator
ON delegatees(
    token_address,
    delegator_address
    );

CREATE INDEX delegatees_index_delegatee
ON delegatees(
    token_address,
    delegatee_address
);
```

### Delegators (Table)
```sql=
CREATE TABLE delegators(
    token_address CHAR(20),
    delegator_address CHAR(20),
    trie_root CHAR(32),
    delegated_block BIGINT 
);

CREATE UNIQUE INDEX delegators_index_delegator
ON delegators(
    token_address,
    delegator_address
    );```

### Token Table
```sql=
Token (
CHAR(20) token_address, (UNIQUE, PRIMARY KEY)
CHAR(20) deployed_instance
)
```

### Tokens (Table)

```sql=
CREATE TABLE tokens(
    token_address CHAR(20) UNIQUE PRIMARY KEY,
    deployed_instance CHAR(20)
);
```
