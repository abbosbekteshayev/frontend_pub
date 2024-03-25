import mammothPlus from 'mammoth-plus'

const validateQuestionFile = async (file: File) => {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return {
            valid: false,
            value: 'Invalid file type'
        }
    }

    try {
        const result = await mammothPlus.convertToHtml({arrayBuffer: await file.arrayBuffer()})

        return {
            valid: true,
            value: result.value
        }
    } catch (e) {
        return {
            valid: false,
            value: e?.message
        }
    }
}

export default validateQuestionFile