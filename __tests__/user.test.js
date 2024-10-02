"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../src/server"));
const index_1 = require("../src/db/index");
describe('POST /api/v1/user/signup', () => {
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cleanup: Remove any test users created during tests
        yield index_1.prismaClient.user.deleteMany(); // Clean up test users after tests
    }));
    it('should sign up a new user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const newUser = {
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123',
        };
        const response = yield (0, supertest_1.default)(server_1.default)
            .post('/api/v1/user/signup')
            .send(newUser);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User signed up successfully!');
    }));
    it('should return an error if user already exists', () => __awaiter(void 0, void 0, void 0, function* () {
        const existingUser = {
            name: 'Existing User',
            email: 'testuser@example.com',
            password: 'password123',
        };
        // First signup to create the user
        yield (0, supertest_1.default)(server_1.default).post('/api/v1/user/signup').send(existingUser);
        // Attempt to sign up again with the same email
        const response = yield (0, supertest_1.default)(server_1.default)
            .post('/api/v1/user/signup')
            .send(existingUser);
        expect(response.status).toBe(403);
        expect(response.body.message).toBe('User with this email already signed up!');
    }));
});
