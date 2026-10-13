# Nyalakan & cek database sample (schema gf)
docker start indusia-akunting-pg | Out-Null
Start-Sleep -Seconds 3
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker exec indusia-akunting-pg psql -U postgres -d indusia-akunting -c "select count(*) as tables from information_schema.tables where table_schema='gf';"
docker exec indusia-akunting-pg psql -U postgres -d indusia-akunting -c "select count(*) as karyawan from gf.s_karyaw where hapus_oleh is null;"
