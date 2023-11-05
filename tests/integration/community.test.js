const request = require('supertest');
const app = require('../../server'); 
const expect = require('chai').expect;
const { connectToMongo, usersCollection } = require('../../src/database/mongo');

describe('a suite auth integration tests', function () {
  let token="";
  this.timeout(10000);

  before(async function() {
    await connectToMongo();
  });

  after(async function () {
    await usersCollection.deleteOne({email:"test@gmail.com"})
  });

  it('1 should create a new user using signup',function(done) {
      const userData = { name: 'test user' ,email:"test@gmail.com",password : '12354545998788349923'};
      request(app)
        .post('/v1/auth/signup')
        .send(userData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
          done();
        });
    });

  it('2 should throw error on existing user',function(done) {
    const userData = { name: 'test user' ,email:"test@gmail.com",password : '12354545998788349923'};
    request(app)
      .post('/v1/auth/signup')
      .send(userData)
      .expect(400)
      .end(function(err, res) {
        expect(res.body.message).to.be.equal("Email already in use");
        done();
      });
  });


  it('3 should signin', function (done) {
    const userData = { email:"test@gmail.com",password : '12354545998788349923'};
      request(app)
        .post('/v1/auth/signin')
        .send(userData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
           expect(res.body.status).to.be.true;
          token = res.body.content.meta.access_token;
          done();
        });
  });
  
  it('4 should verify signin', function (done) {
      request(app)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer '+token)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
           expect(res.body.status).to.be.true;
          done();
        });
  });
});

