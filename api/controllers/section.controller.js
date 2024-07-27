exports.addSection = async (req, res) => {
  try {
    const { type, name, stack, plants } = req.body


    // Create new section
    const newSection = new Section({
      type,
      name,
      stack,
      plants
    })

    // Save section to database
    const savedSection = await newSection.save()

    res.status(201).json(savedSection)
  } catch (error) {
    console.error('Error adding section:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
