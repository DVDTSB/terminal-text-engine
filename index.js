#!/usr/bin/env node

const colors = require("ansi-colors");
const fs = require("fs");
var request = require("request");
const prompt = require("prompt-sync")({
  sigint: true,
});
let disk;
let input;
let data = {};

let start = () => {
  console.log(
    "\n    Welcome to the "+
    colors.green(
      "Slighty Improoved Terminal Only Text Adventure Engine!"
    )
  );
  console.log(`
    What do you wish to do?
      1. Play a game
      2. Download a game
      3. Learn more about the engine
      4. Exit
    `);
  let epic = prompt("> ");
  if (epic == "1") {
    console.log(
      colors.green(
        "\n    Very good! Here is a list of your donwloaded games!\n"
      )
    );
    fs.readdirSync("./disks/").forEach((file) => {
      console.log("     " + file);
      console.log("");
    });
    let name = prompt("> ");
    try {
      data = require(`./disks/${name}.disk`);
    } catch (e) {
      data = require(`./disks/${name}.js`);
    }
    data = data.game;
    loadDisk(data);
    console.log("\nDo you want to load a save? (y/n)\n");
    let save = prompt("> ");
    if (save == "y") {
      console.log(colors.green("\nExcellent!\n"));
      loadSave(name);
    } else {
      console.log("\nAlrighty then! Here is your game!\n");
      console.log(colors.green("\nHAVE FUN!\n"));
    }
    startgame();
  } else if (epic == "2") {
    download();
  } else if (epic == "3") {
    console.log(`
    This is a rewrite of Text-Engine by okaybenji
    It offers more customaztion and features, like online game sharing
    It is only avalibale as a terminal app because I do not know how to vanilla javascript
    I am not responsible for any damage you may cause to your computer
    `);
    start();
  } else {
    console.log(colors.red("\nGoodbye!\n"));
  }
};
let download = () => {
  console.log(colors.green("\nExcellent! What is the name of the game?\n"));
  let name = prompt("> ");
  console.log(colors.green("\nWhat is the url of the game?\n"));
  let url = prompt("> ");
  console.log(colors.green(`\nDownloading from ${url}...\n`));
  try {
    request(url).pipe(fs.createWriteStream(`./disks/${name}.disk`));
    console.log(colors.green(`\nDownloaded ${name}.disk\n`));
    start();
  } catch (e) {
    console.log(colors.red("\nError downloading game, please try again\n"));
    console.log("\nTry again? (y/n)\n");
    let again = prompt("> ");
    if (again == "y") {
      download();
    } else {
      start();
    }
  }
};
let utilities = {
  getRoom: (id) => disk.rooms.find((room) => room.id == id),
  getAction: (action) => disk.actions.find((a) => a.name == action),
  getExit: (room, exit) => room.exits.find((e) => e.dir == exit),
  getCharacter: (name) => disk.characters.find((c) => c.name.toLowerCase() == name.toLowerCase()),
  save: (name) => {
    let save = JSON.stringify(disk, (key, value) => typeof value === 'function' ? value.toString() : value);
    fs.writeFileSync(`./saves/${name}.save`, save);
    console.log(colors.green(`Saved as ${name}.save`));
  },
  askForInput: () => {
    let inpt = prompt("> ");
    inpt = inpt.toLowerCase();
    let words = inpt.split(" ");
    return words;
  }
};
let startgame = () => {
  var lines = process.stdout.getWindowSize()[1];
  for (var i = 0; i < lines; i++) {
    console.log("\r\n");
  }
  disk.load(utilities, disk);
  while (true) {
    handleInput();
  }
};

let handleInput = () => {
  input = prompt("> ");
  input = input.toLowerCase();
  let words = input.split(" ");
  let action = words[0];
  let target = words.slice(1).join(" ");
  let tried = false;
  try {
    utilities.getRoom(disk.roomId).onAction(action);
  } catch (e) {}

  if (utilities.getRoom(disk.roomId).items) {
    utilities.getRoom(disk.roomId).items.forEach((item) => {
      if (item.name == target && tried == false) {
        try {
          if (item.onAction(action) == true) {
            tried = true;
          }
        } catch (e) {}
      }
    });
  }
  disk.characters.forEach((c) => {
    if(Array.isArray(c.name))
    {
      if (c.name[0].toLowerCase() == target && tried == false) {
        try {
          tried = c.onAction(utilities,disk, action);
        } catch (e) {
        }
      }
    }
    else if (c.name.toLowerCase() == target && tried == false) {
      try {
        tried = c.onAction(utilities,disk, action);
      } catch (e) {
      }
    }
  });
  disk.inventory.forEach((item) => {
    if (item.name == target && tried == false) {
      try {
        tried = item.onAction(utilities, action);
      } catch (e) {
      }
    }
  });

  if (tried === false) {
    try{
    utilities.getAction(action).func(utilities, disk, target);
    }catch(e){
      console.log(colors.red("\nI don't understand that command\n"));
    }
  }
  tried = false;
};
let loadDisk = (uninitdisk) => {
  disk = init(uninitdisk);
  
  console.log(colors.green("\nLoaded disk"));
};

let init = (disk) => {
  let initdisk = Object.assign({}, disk);
  initdisk.rooms = disk.rooms.map((room) => {
    room.visits = 0;
    return room;
  });
  if (!initdisk.inventory) {
    initdisk.inventory = [];
  }
  if (!initdisk.items) {
    initdisk.items = [];
  }
  if (!initdisk.characters) {
    initdisk.characters = [];
  } else {
    initdisk.characters = disk.characters.map((char) => {
      char.chatlog = [];
      return char;
    });
  }
  initdisk.extraInit();
  return initdisk;
};

let loadSave = (name) => {
  let thing = fs.readFileSync(`./saves/${name}.save`);
  let loaded = JSON.parse(thing, (key, value) => {
    try {
      return eval(value);
    } catch (error) {
      return value;
    }
  });
  disk = loaded;
  console.log(colors.green(`\nLoaded ${name}.save\n`));
};

start();
