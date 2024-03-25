# nicedear

A library that generates random avatars.

# API/Usage

1. ```node dist/server.js```

**http://localhost:3000/**

`GET http://localhost:3000/?seed=123&theme=open-peeps&mirror=true&rotate=45&background=white&skincolor=black&hairColor=brown&scale=1&transalteX=10&transalteY=20&features[]=feature1&features[]=feature2`


2. ```node dist/index.js```

```node dist/index.js foo open-peeps true 45 red skinColor hairColor 1.0 10.0 20.0 face,facial-hair,head```


##	seed?: string;

The seed for the random generator. This is used to generate the same avatar again. A random seed is used if not provided. **A seed is a string** that can be used to generate the same avatar again. 

##	theme?: string;

The theme of the avatar. The default theme is `open-peeps`.
The soon to be available themes are `open-peeps`, `female`, `male`, `bottts`, `gridy`, `identicon`, `initials`, `jdenticon`, `micah`, `mp`, `retro`, `robohash`, `wavatar`, `yld`.


## Parameters:

	background?: string;
	skincolor?: string;
	hairColor?: string;
	scale?: number;
	transalteX?: number;
	transalteY?: number;
	features?: string[];

 
### mirror?: boolean;

When set true, this flips the image.

###	rotate?: number;

Rotates the image by the given degrees.

###	background?: string;

The hex of the background color of the image. The default background color is `white`/ `#ffffff`.

###	skincolor?: string;

The hex of the color of the avatar's skin. The default is white/`#ffffff`.

###	hairColor?: string;

The hex of the color of the avatar's hair. The default is black/`#000000`.

###	scale?: number;

The scale of the avatar. The default is `1`.

###	transalteX?: number;

The x-coordinate of the avatar. The default is `0`.

###	transalteY?: number;

The y-coordinate of the avatar. The default is `0`.

###	features?: string[];

The features of the avatar. Available features are `face`, `facial-hair`, `head`. The default is `face`, `head`.
