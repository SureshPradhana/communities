const { expect } = require('chai');
const {
  userSchema,
  signInSchema,
  roleSchema,
  communitySchema,
  memberSchema,
} = require('../../src/middleware/validation'); 

describe('Validation Schemas', () => {
  describe('userSchema', () => {
    //Tests for userSchema
    it('should validate a valid user object', () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      const { error } = userSchema.validate(validUser);
      expect(error).to.be.undefined;
    });

    it('should return an error for an invalid user object', () => {
      const invalidUser = {
        name: 'Jo',
        email: 'invalid-email',
        password: 'pass',
      };
      const { error } = userSchema.validate(invalidUser);
      expect(error).to.exist;
    });
  });

  describe('signInSchema', () => {
    it('should validate a valid sign-in object', () => {
      const validSignIn = {
        email: 'john@example.com',
        password: 'password123',
      };
      const { error } = signInSchema.validate(validSignIn);
      expect(error).to.be.undefined;
    });

    it('should return an error for an invalid sign-in object', () => {
      const invalidSignIn = {
        email: 'invalid-email',
        password: '',
      };
      const { error } = signInSchema.validate(invalidSignIn);
      expect(error).to.exist;
    });
  });


  describe('roleSchema', () => {
    // Test cases for roleSchema
    it('should validate a valid role object', (done) => {
      const validRole = {
        name: 'Admin'
      };
      const { error } = roleSchema.validate(validRole);
      expect(error).to.be.undefined;
      done()
    })
    
    it('should return an error for an invalid role object', (done) => {
      const invalidRole = {
        name: 'Ad'
      };
      const { error } = roleSchema.validate(invalidRole);
      expect(error).to.exist;
      done()
    })
    
  });

  describe('communitySchema', () => {
    // Test cases for communitySchema
    it('should validate a valid community object', (done) => {
      const validCommunity = {
        name: 'My Community',
      }
      const { error } = communitySchema.validate(validCommunity);
      expect(error).to.be.undefined;
      done()
      })
    it('should return an error for non valid name on community object', (done) => {
    const invalidCommunity = {
    }
    const { error } = communitySchema.validate(invalidCommunity);
    expect(error).to.exist;
    done()
    })
  });

  describe('memberSchema', () => {
    // Tests for memberSchema
    it('should validate a valid member object', (done) => {
      const validMember = {
        role: '1213133131',
        community: '13131313131',
        user: '13131313131',
      }
      const { error } = memberSchema.validate(validMember);
      expect(error).to.be.undefined;
      done()
    })
    
    it('should return an error for non valid role on member object', (done) => {
      const invalidMember = {
        role: null,
        community: null,
        user: null,
      }
      const { error } = memberSchema.validate(invalidMember);
      expect(error).to.exist;
      done()
    })
  })

});
