const request = require('supertest');
const app = require('../../server'); 
const expect = require('chai').expect;
const { connectToMongo,usersCollection } = require('../../src/database/mongo');

describe("auth unit tests")
