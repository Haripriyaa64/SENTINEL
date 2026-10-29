# Attack log, 2026-10-26 (UTC, from eve.json)
Attacker: Kali 10.151.103.71, Victim: Ubuntu 10.151.103.231
- 17:58:31  nmap -sS -T4 -p 1-1000    -> port scan
- 17:58:55  hydra -l ravi -P small.txt -> SSH brute force
- 17:59:26  hping3 -S -p 80 -c 3000    -> SYN flood
Note: nmap and hping3 each triggered both the scan and flood rules (rule overlap).