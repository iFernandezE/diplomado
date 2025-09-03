import { User } from '../models/user.js';
import { Task } from '../models/task.js';
import { Status } from '../constants/index.js';
import { encriptar } from '../common/bcrypt.js';
import { Op } from 'sequelize';

async function getUsers1(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'password', 'status'],
      order: [['id', 'DESC']],
      where: {
        status: Status.ACTIVE,
      },
    });
    return res.json(users);
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  const { username, password } = req.body;
  try {
    const user = await User.create({
      username,
      password,
    });
    return res.json(user);
  } catch (error) {
 
    next(error);
  }
}

async function getUser(req, res, next) {
  const { id } = req.params;
  try {
    const user = await User.findOne({
      attributes: ['username', 'password', 'status'],
      where: {
        id,
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  const { id } = req.params;
  const { username, password } = req.body;
  try {
    if (!username && !password) {
      return res
        .status(400)
        .json({ message: 'Username or password is required' });
    }

    // TODO: revisar ya q esto deberia ser automático
    const passwordEncriptado = await encriptar(password);

    const user = await User.update(
      {
        username,
        password: passwordEncriptado,
      },
      {
        where: {
          id,
        },
      }
    );

    return res.json(user);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  const { id } = req.params;
  try {
    await User.destroy({
      where: {
        id,
      },
    });
    return res.status(204).json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
}

async function activateInactivate(req, res, next) {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const user = await User.findByPk(id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.status === status)
      return res.status(409).json({ message: 'Same status' });

    user.status = status;
    await user.save();
    return res.json(user);
  } catch (error) {
    next(error);
  }
}



async function getTasks(req, res, next) {
  const { id } = req.params;
  try {
    const user = await User.findOne({
      attributes: ['username'],
      include: [
        {
          model: Task,
          attributes: ['name', 'done'],
          /* where: {
          done: false
        } */
        },
      ],
      where: {
        id,
      },
    });
    return res.json(user);
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res) {
  const { page, limit, orderBy, orderDir = 'DESC', search, status } = req.query;
  const order =
    orderBy && orderDir ? [[orderBy, orderDir.toUpperCase()]] : [['id', 'ASC']]; // Orden por defecto
  const where = {};
  if (search) {
    where.username = {
      [Op.iLike]: `%${search}%`,
    };
  }

  if (status) {
    console.log('stat', status)
    if (status !== Status.ACTIVE && status !== Status.INACTIVE)
      return res.status(400).json({
        message: `Invalid status, must be ${Status.ACTIVE} or ${Status.INACTIVE}`,
      });
    where.status = {
      [Op.iLike]: `${status}`,
    };
    where.status = status;
  }

  try {
    const users = await User.findAndCountAll({
      attributes: ['id', 'username', 'status'],
      where: Object.keys(where).length > 0 ? where : undefined,
      limit,
      offset: (page - 1) * limit,
      order,
    });

    return res.json({
      total: users.count,
      page: parseInt(page),
      pages: Math.ceil(users.count / limit),
      data: users.rows,
    });
  } catch (error) {
    console.log("llega aqui");
    next(error);
  }
}

export default {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  activateInactivate,
  getTasks,
};
