/*
    Challenge: Implement a Secure Fund Transfer Function

    In this challenge, you will implement a PostgreSQL stored function to simulate transferring funds 
    between two accounts in a banking system. The function must follow proper validation, ensure data 
    integrity, and log transactions with a shared reference.

    Your function should be named:
    banking.transfer_funds(from_id INT, to_id INT, amount NUMERIC)

    The function must:

    - Prevent transfers to the same account
    - Ensure the transfer amount is greater than zero
    - Validate that both sender and recipient accounts exist
    - Prevent transfers if either account is marked as "frozen"
    - Ensure the sender has sufficient funds
    - Debit the sender and credit the recipient atomically
    - Log two transactions: a withdrawal and a deposit, both linked by the same UUID reference
    - Raise meaningful exceptions for all validation failures

    The function should perform all operations within a safe transactional context, maintaining 
    database consistency even in the event of failure.

    Notes:
    - In order to test you can mock some additional data in the tables that participates in this challenge.
    - Make sure of raising errors when they're present

    ERD:
    +---------------------+            +--------------------------+
    |     accounts        |            |      transactions        |
    +---------------------+            +--------------------------+
    | account_id (PK)     |<-----------| transaction_id (PK)      |
    | balance             |            | account_id (FK)          |
    | status              |            | amount                   |
    +---------------------+            | transaction_type         |
                                       | reference                |
                                       | transaction_date         |
                                       +--------------------------+
*/


CREATE OR REPLACE FUNCTION banking.transfer_funds(
    from_id INT,
    to_id INT,
    amount NUMERIC
) RETURNS VOID AS $$
DECLARE
    sender_balance NUMERIC;
    sender_status TEXT;
    recipient_status TEXT;
    tx_ref TEXT;
BEGIN
    -- 1. Prevent transfer to the same account
    IF from_id = to_id THEN
        RAISE EXCEPTION 'Cannot transfer to the same account (account_id: %)', from_id;
    END IF;

    -- 2. Ensure amount is greater than zero
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be greater than zero (got: %)', amount;
    END IF;

    -- 3. Validate sender exists and lock the row
    SELECT a.balance, a.status INTO sender_balance, sender_status
    FROM banking.accounts a
    WHERE a.account_id = from_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sender account % does not exist', from_id;
    END IF;

    -- 4. Validate recipient exists and lock the row
    SELECT a.status INTO recipient_status
    FROM banking.accounts a
    WHERE a.account_id = to_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recipient account % does not exist', to_id;
    END IF;

    -- 5. Check neither account is frozen
    IF sender_status = 'frozen' THEN
        RAISE EXCEPTION 'Sender account % is frozen', from_id;
    END IF;

    IF recipient_status = 'frozen' THEN
        RAISE EXCEPTION 'Recipient account % is frozen', to_id;
    END IF;

    -- 6. Check sufficient funds
    IF sender_balance < amount THEN
        RAISE EXCEPTION 'Insufficient funds in account % (balance: %, requested: %)', from_id, sender_balance, amount;
    END IF;

    -- 7. Debit sender and credit recipient
    UPDATE banking.accounts SET balance = balance - amount WHERE account_id = from_id;
    UPDATE banking.accounts SET balance = balance + amount WHERE account_id = to_id;

    -- 8. Log two transactions with a shared UUID reference
    tx_ref := gen_random_uuid()::TEXT;

    INSERT INTO banking.transactions (account_id, amount, transaction_type, reference)
    VALUES (from_id, amount, 'withdrawal', tx_ref);

    INSERT INTO banking.transactions (account_id, amount, transaction_type, reference)
    VALUES (to_id, amount, 'deposit', tx_ref);
END;
$$ LANGUAGE plpgsql;
