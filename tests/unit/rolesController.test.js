const request = require('supertest');
const app = require('../../server'); // Adjust the path as per your project structure
const expect = require('chai').expect;
const { connectToMongo, rolesCollection } = require('../../src/database/mongo');
describe('a suite auth unit tests', function () {

  this.timeout(10000);

  before(async function() {
    await connectToMongo();
    await rolesCollection.deleteMany({});
  });

  it('1 should create a new role',function(done) {

      const roleData = { name: 'Test Role 8' };
      request(app)
        .post('/v1/role')
        .send(roleData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
        });
    done();
    });

  it('2 should get roles', function (done) {
    request(app)
        .get('/v1/role')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
        });
    done();
  });
});
