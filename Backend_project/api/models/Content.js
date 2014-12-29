/**
* Content.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
      id:{
          type: 'string',
          autoIncrement: true,
          primaryKey:true
      },
      title:{
          type:'string',
          required:true
      },
      path:{
          type:'string'
      },
      uploadedBy:{
          model:'user'
      },
      contentType:{
          type:'string',
          enum:['image/png','image/jpeg','ytb','audio/mpeg','audio/mp3']
      },
      loves:{
          type:'integer',
          defaultsTo:0
      },
      hates:{
          type:'integer',
          defaultsTo:0
      }
  }
};

