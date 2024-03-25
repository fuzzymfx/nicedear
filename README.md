## NiceDear

NiceDear is a versatile library for generating random avatars with customizable features. With NiceDear, you can easily create unique avatars tailored to your needs, whether for user profiles, chat applications, or any other creative use.

### Installation and Usage

1. Start the server:

```bash
node dist/server.js
```

The server will be accessible at http://localhost:3000/.

1. Direct usage:

```bash
node dist/index.js [seed] [theme] [mirror] [rotate] [background] [skincolor] [hairColor] [scale] [transalteX] [transalteY] [features]
```

2. API usage:

```bash
node dist/server.js
```

```bash
GET http://localhost:3000/?seed=<seed>&theme=<theme>&mirror=<mirror>&rotate=<rotate>&background=<background>&skincolor=<skincolor>&hairColor=<hairColor>&scale=<scale>&transalteX=<transalteX>&transalteY=<transalteY>&features[]=feature1&features[]=feature2
```

### Parameters

- **seed**: string
The seed for the random generator. Used to generate the same avatar again. If not provided, a random seed is used.
- **theme**: string
The theme of the avatar. Defaults to open-peeps. Available themes include open-peeps, female, male, bottts, gridy, identicon, initials, jdenticon, micah, mp, retro, robohash, wavatar, yld.
- **mirror**: boolean
When set true, flips the image.
- **rotate**: number
Rotates the image by the given degrees.
- **background**: string
The hex code of the background color. Defaults to #ffffff.
- **skincolor**: string
The hex code of the avatar's skin color. Defaults to #ffffff.
- **hairColor**: string
The hex code of the avatar's hair color. Defaults to #000000.
- **scale**: number
The scale of the avatar. Defaults to 1.
- **transalteX**: number
The x-coordinate of the avatar. Defaults to 0.
- **transalteY**: number
The y-coordinate of the avatar. Defaults to 0.
- **features**: string[]
The features of the avatar. Available features are face, facial-hair, head. Defaults to face, head.

### Examples

```bash
node dist/index.js foo open-peeps true 45 red skinColor hairColor 1.0 10.0 20.0 face,facial-hair,head
```

```bash
curl http://localhost:3000/?seed=foo&theme=open-peeps&mirror=true&rotate=45&background=red&skincolor=skinColor&hairColor=hairColor&scale=1.0&transalteX=10.0&transalteY=20.0&features[]=face&features[]=facial-hair&features[]=head
```

(*Pro tip: A simple get request returns a random avatar.*)

### Notes

- A seed is a string that can be used to generate the same avatar again. If no seed is provided, a random one is generated.
- All color parameters expect hex color codes.
- For features, separate each feature with commas.

You can use the [NiceDear API](https://api.nicedear.vip/) to generate avatars.


### Authors

- [injuly](https://injuly.in)
- [fuzzymf](https://anubhavp.dev)



### License

NiceDear is licensed under the MIT License. See LICENSE for more information.
