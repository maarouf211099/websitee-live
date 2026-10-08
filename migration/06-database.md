# Step 6 — Database (SQL Server → SQL Server 2022 on vm-mersal-db)

Why a SQL VM and not Azure SQL Database: the apps log in as `sa`, are compiled (no source), and old
.NET apps often use cross-database queries, SQL Agent jobs or `sa`-level features that Azure SQL
Database does not support. A SQL VM is a like-for-like move; moving to Azure SQL can come later.

## Trial restore (any time, no downtime)
On the current SQL server (10.128.0.14), for each database from `databases.txt` (step 1):
```sql
BACKUP DATABASE [mersal_DB_prod_fixed] TO DISK = N'C:\Backup\mersal_DB_prod_fixed_full.bak'
  WITH COPY_ONLY, COMPRESSION, CHECKSUM, STATS = 10;
```
`COPY_ONLY` does not disturb the existing backup chain.

Copy to Azure (from the SQL server):
```
azcopy copy "C:\Backup\*_full.bak" "https://<storage>.blob.core.windows.net/migration/db/?<SAS>"
```
On vm-mersal-db: download with azcopy to `F:\Backup`, then
```sql
RESTORE FILELISTONLY FROM DISK = N'F:\Backup\mersal_DB_prod_fixed_full.bak';
RESTORE DATABASE [mersal_DB_prod_fixed] FROM DISK = N'F:\Backup\mersal_DB_prod_fixed_full.bak'
  WITH MOVE '<data logical name>' TO N'F:\Data\mersal_DB_prod_fixed.mdf',
       MOVE '<log logical name>'  TO N'F:\Log\mersal_DB_prod_fixed_log.ldf',
       RECOVERY, STATS = 10;
```
Then recreate SQL logins used by the apps (`sa` exists already — set a **new** password) and fix
orphaned users: `EXEC sp_change_users_login 'Report';`

Also copy over: SQL Agent jobs (script them from SSMS → SQL Server Agent → Jobs → Script Job as),
linked servers, and any `Database Mail` profile.

## Cutover restore (in the maintenance window)
Same steps with a fresh backup taken **after** the site is stopped, so no donation is lost.
Use `WITH NORECOVERY` + a final log/differential backup if the full backup is too slow to copy.
