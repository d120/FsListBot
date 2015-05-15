# Sitzungshelfer

## Deployment

Als eigene Prozesse:

```bash
node fslistbot.js
sudo ssh -L 0.0.0.0:25:localhost:3001 -i /root/.ssh/id_rsa root@localhost -N
```

Einen Webserver nach Wahl als Proxy konfigurieren, z.B. Apache:

```
ProxyPass / http://localhost:3000/
ProxyPassReverse / http://localhost:3000/
```

## Lizenz

GPL Version 2 (in diesem Repository enthalten)\\
Copyright (C) 2015 Johannes Lauinger
