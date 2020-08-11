import { Request, Response } from "express";
import convertHourToMinutes from "../utils/convertHourToMinutes";
import db from "../database/connection";

interface ScheduleItem {
    dia_semana: Number;
    horario_inicio: String;
    horario_fim: String;
}

export default class ClassesController {
    async index(req: Request, res: Response) {
        const filters = req.query;

        const materia = filters.materia as string;
        const dia_semana = filters.dia_semana as string;
        const hora = filters.hora as string;

        if (!filters.dia_semana || !filters.materia || !filters.hora) {
            return res.status(400).json({ error: "Digite um filtro para listar as aulas!" });
        }

        const horaEmMinutos = convertHourToMinutes(hora);

        const classes = await db("classes")
            .whereExists(function () {
                this.select("class_schedule.*")
                    .from("class_schedule")
                    .whereRaw("`class_schedule`.`class_id` = `classes`.`id`")
                    .whereRaw("`class_schedule`.`dia_semana` = ??", [Number(dia_semana)])
                    .whereRaw("`class_schedule`.`horario_inicio` <= ??", [horaEmMinutos])
                    .whereRaw("`class_schedule`.`horario_fim` > ??", [horaEmMinutos]);
            })
            .where("classes.materia", "=", materia)
            .join("users", "classes.user_id", "=", "users.id")
            .select(["classes.*", "users.*"]);
        res.json(classes);
    }

    async create(req: Request, res: Response) {
        const { nome, avatar, whatsapp, bio, email, materia, custoHora, schedule } = req.body;

        const trx = await db.transaction();

        try {
            const insereIdsUsuarios = await trx("users").insert({
                nome,
                avatar,
                whatsapp,
                bio,
                email,
            });

            const user_id = insereIdsUsuarios[0];

            const insereIdsAulas = await trx("classes").insert({
                materia,
                custoHora,
                user_id,
            });

            const class_id = insereIdsAulas[0];

            const classSchedule = schedule.map((ScheduleItem: ScheduleItem) => {
                return {
                    class_id,
                    dia_semana: ScheduleItem.dia_semana,
                    horario_inicio: convertHourToMinutes(ScheduleItem.horario_inicio),
                    horario_fim: convertHourToMinutes(ScheduleItem.horario_fim),
                };
            });

            await trx("class_schedule").insert(classSchedule);

            await trx.commit();

            return res.status(201).send();
        } catch (error) {
            await trx.rollback();
            return res.status(400).json({
                error: "Erro ao criar!",
            });
        }
    }
}
