// controllers/puntoEncuentroController.js
module.exports = {
  crear: async (_req,res)=> res.json({ ok:true, stub:'crear' }),
  listar: async (_req,res)=> res.json([]),
  actualizar: async (_req,res)=> res.json({ ok:true }),
  eliminar: async (_req,res)=> res.json({ ok:true }),
};
