const request = require('supertest');

var { track, identify } = require('../util/analytics')
const { prismaMock } = require('./singleton')

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => { req.user = { "id": 'mockUserId' }; next() }));
jest.mock('../util/analytics');
jest.mock('node-schedule');

const app = require('../app');

it('should get index', async () => {

    const res = await request(app)
        .get('/')

    expect(res.status).toBe(200);
})

it('should create label', async () => {

    workspace_id = '4c155eb6-fad1-42b3-a43b-b4f423d7b87b'
    board_id = '66739734-ed1c-457c-be30-6eca38b86ea2'
    label_id = 'ce345b45-9e86-4922-9949-f391cfa16bd8'

    const label = {
        id: label_id,
        name: 'label_name',
        color: 'color'
    }

    const board = {
        "id": board_id,
        "workspace_id": workspace_id,
        "name": "board_name"
    }

    const workspace_members = {
        "workspace_id": workspace_id,
        "user_id": "mockUserId"
    }

    prismaMock.boards.findUnique.mockResolvedValue(board)
    prismaMock.workspace_members.findFirst.mockResolvedValue(workspace_members)
    prismaMock.labels.create.mockResolvedValue(label)

    const res = await request(app)
        .post(`/boards/${board_id}/labels`)
        .set('Content-Type', 'application/json')
        .send(label)

    expect(res.status).toBe(302);
    expect(prismaMock.labels.create).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Label Created", { workspace_id: workspace_id, board_id: board_id, label_id: label_id });
})


