import {User} from '../models/user.js'
import {Task} from '../models/task.js'
import logger from '../logs/logger.js'
import {Status} from '../constants/index.js'
import { encriptar } from '../common/bcript.js'
import { Op } from 'sequelize';

async function getUsers(req, res, next) {
    try{
        const users = await User.findAll({
            attributes: ['id','username','password','status'],
            order: [['id', 'DESC']],
            where:{
                status: Status.ACTIVE,
            },
        })
        res.json(users);
    }
    catch(error){
        next(error);
    }
}

async function createUser(req, res, next){
    const{username,password} = req.body;
    try{
        const user = await User.create({
            username,
            password,
        })
        res.json(user)
    }catch(error){
        next(error);
    }
}

async function getUser(req,res,next){
    const {id} = req.params;
    try{
        const user = await User.findOne({
            attributes: ['username','password','status'],
            where: {
                id
            }
        });
        if (!user) res.status(404).json({message: 'User not found'})
        res.json(user);
    }catch(error){
        next(error);
    }
}

async function updateUser(req,res,next){
    const {id} = req.params;
    const {username, password}= req.body;
    try{
        if (!username && !password) {
            return res
            .status(400)
            .json({message: 'Username and password are required'});
        }

        const passwordEncriptado = await encriptar(password);

        const user = await User.update({
            username,
            password: passwordEncriptado,
        },{
            where: {
                id
            }
        });
        res.json(user);
    }catch(error){
        next(error);
    }
}

async function deleteUser(req,res,next){
    const {id} = req.params;
    try{
        await User.destroy({
            where: {
                id
            },
        });
        res.status(204).json({message: 'User deleted successfully'});
    }catch(error){
        next(error);
    }
}

async function activateInactivate(req, res, next) {
    const {id} = req.params;
    const {status} = req.body;
    try {
        if(!status) res.status(400).json({message: 'Status is required'});
        
        const user = await User.findByPk(id);
        
        if(!user) res.status(404).json({message: 'User not found'});

        if (user.status === status) {
            res.status(400).json({message: 'same status'});
        }
        user.status = status;
        await user.save();
        res.json(user);
    }catch(error) {
        next(error);
    }
}

async function getTasks(req,res,next){
    const {id} = req.params;
    try {
        const user = await User.findOne({
            attributes: ['username'],
            include: [
                {
                    model: Task,
                    attributes: ['name','done'],
                    // where:{
                    //     done:false
                    // }
                }
            ],
            where: {
                id
            }
        })
        res.json(user);
    } catch (error) {
        next(error)
    }
}

async function getUsersPagination(req, res, next) {
    try {
        // 1. Extraer los query params con valores por defecto
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const orderBy = req.query.orderBy || 'id';
        const orderDir = req.query.orderDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const offset = (page - 1) * limit;

        // 2. Consultar con filtros
        const { count, rows } = await User.findAndCountAll({
            attributes: ['id', 'username', 'status'],
            where: {
                username: {
                    [Op.iLike]: `%${search}%`,
                },
            },
            order: [[orderBy, orderDir]],
            limit,
            offset
        });

        // 3. Responder en formato requerido
        res.json({
            total: count,
            page,
            pages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        next(error);
    }
}

export default{
    getUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    activateInactivate,
    getTasks,
    getUsersPagination
}