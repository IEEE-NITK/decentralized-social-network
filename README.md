# Decentralized Secure Social Network

## Table of contents
* [General info](#general-info)
* [Screenshots](#screenshots)
* [Design](#design)
* [Main Tools/Technologies](#main-tools/technologies)
* [Setup](#setup)
* [Features](#features)
* [Inspiration](#inspiration)

## General Info
This project aims to implement a Decentralized, Secure Social Network based on IPFS. There are numerous advantages of the decentralized approach - the user has the key to decrypt and modify their own data and hence have complete control over their data. They can grant and revoke control from third parties.  
In our Social Network model, everyone’s data is just ‘out there’ - many copies floating around in encrypted blobs that anyone can host or download but only friends can decrypt. Decentralization also provides robustness against censorship, internet outages, and would-be social monopolies.

## Screenshots
Coming Soon!

## Design
TODO

## Main Tools/Technologies
* [JS IPFS](https://js.ipfs.io/)
* [Node.js](https://nodejs.org/en/)
* [Orbit-DB](https://github.com/orbitdb/orbit-db)
* [Orbit-Core](https://github.com/orbitdb/orbit-core)
* [Browserify](http://browserify.org/) and [Watchify](https://www.npmjs.com/package/watchify)

## Setup

### Starting the server

**1. Linux**  

Run the following in the project's root directory  
```bash
npm install
npm start
```

**2. Windows**  

First, in *package.json*, change   
``` 
"http-server": "~0.11.1", 
```  
to  
``` 
"http-server": "0.9.0", 
```  
then run  
```bash
npm install
npm start
```   
in the project's root directory  

### Using the web-app
Open your browser at `http://127.0.0.1:8888`  
Note the outputs in the console while using the website.

## Features
List of features ready and TODOs for future development
* TODO

To-do list:
* Add the below to npm dependencies   
npm install orbit-db ipfs  
npm install --global babel-cli  
npm install --global webpack  
npm i ipfs-mfs  


## Inspiration
https://courses.csail.mit.edu/6.857/2019/project/17-Foss-Pfeiffer-Woldu-Williams.pdf