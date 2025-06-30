import {User} from '../models/user.js'
import {Task} from '../models/task.js'
import logger from '../logs/logger.js'
import { Status, AllowedLimits, AllowedOrderBy, AllowedOrderDir } from '../constants/index.js';
import { encriptar } from '../common/bcript.js'
import { Op } from 'sequelize';

async function getUsers(req, res, next) {
    try{
        const users = await User.findAll({
            attributes: ['id','username','password','status','updatedAt','createdAt'],
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
        const {
            page = 1,
            limit = 10,
            search = '',
            orderBy = 'id',
            orderDir = 'DESC',
        } = req.query;

        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);

        if (!AllowedLimits.includes(limitInt)) {
            return res.status(400).json({ message: "invalid limit." });
        }

        if (!AllowedOrderBy.includes(orderBy)) {
            return res.status(400).json({ message: "invalid orderBy. " });
        }

        const orderDirUpper = orderDir.toUpperCase();
        if (!AllowedOrderDir.includes(orderDirUpper)) {
            return res.status(400).json({ message: "invalid orderDir. " });
        }

        const offset = (pageInt - 1) * limitInt;

        const { count, rows } = await User.findAndCountAll({
            attributes: ['id', 'username', 'status'],
            where: {
                username: {
                    [Op.iLike]: `%${search}%`,
                },
                status: Status.ACTIVE
            },
            order: [[orderBy, orderDirUpper]],
            limit: limitInt,
            offset
        });

        const totalPages = Math.ceil(count / limitInt);

        res.json({
            total: count,
            page: pageInt,
            pages: totalPages,
            data: rows,
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