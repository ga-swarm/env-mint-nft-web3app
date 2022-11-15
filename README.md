
# build

```
> node --version
v10.19.0

> npm -V
6.14.4
```

```
> npm install
> npm run build
```

И отдать нжинксом все, что есть в `/build`

Пока ворнингов нет, но если билд не будет собираться из-за них, то в `package.json` поменять (30 строка):

```
"build": "react-scripts build",
```

на

```
"build": "CI=false; react-scripts build",
```