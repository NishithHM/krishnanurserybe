exports.generateNumber = async (req, res) => {
  res.status(200).json({number:Math.random()*100})
}