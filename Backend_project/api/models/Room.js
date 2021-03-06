/**
* Room.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
      name:{
          type:'string',
          primaryKey:'true',
          required:'true'
      },
      users:{
          collection:'user',
          via:'rooms',
          dominant:true

      },
      currentContent:{
          model: 'content'
      }
  }
};

