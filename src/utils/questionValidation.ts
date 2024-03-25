type TParsedQuestion = {
    question: string;
    options: {
        option: string;
        correct: boolean;
    }[];
}

const questionValidation = (questions: TParsedQuestion[]) => {
    const errors: { number: number, message: string }[] = []

    let questionNumber = 1
    for (const question of questions) {
        if (question.question.trim() === '') errors.push({
            number: questionNumber, message: `Вопрос ${questionNumber}. Вопрос не может быть пустым`
        })
        if (question.options.length < 4) errors.push({
            number: questionNumber, message: `Вопрос ${questionNumber}. Вопрос должен иметь минимум 4 варианта ответа`
        })
        if (question.options.filter(option => option.correct).length === 0) errors.push({
            number: questionNumber, message: `Вопрос ${questionNumber}. Вопрос должен иметь минимум 1 правильный ответ`
        })
        if (question.options.filter(option => option.correct).length > 1) errors.push({
            number: questionNumber,
            message: `Вопрос ${questionNumber}. Вопрос не может иметь более 1 правильного ответа`
        })
        if (question.options.filter(option => option.option.trim() === '').length > 0) errors.push({
            number: questionNumber, message: `Вопрос ${questionNumber}. Вариант ответа не может быть пустым`
        })


        // unique options
        const options = question.options.map(option => option.option)
        const uniqueOptions = [...new Set(options)]
        if (options.length !== uniqueOptions.length) errors.push({
            number: questionNumber, message: `Вопрос ${questionNumber}. Варианты ответа должны быть уникальными`
        })

        // unique question
        const findQuestion = questions.filter(q => q.question === question.question)
        if (findQuestion.length > 1) errors.push({
            number: questionNumber, message: `Вопрос ${questionNumber}. Вопросы должны быть уникальными`
        })

        // unique question and options together even options are shuffled
        const findQuestionAndOptions = questions.filter(q => q.question === question.question && q.options.map(option => option.option).sort().join('') === question.options.map(option => option.option).sort().join(''))
        if (findQuestionAndOptions.length > 1) errors.push({
            number: questionNumber,
            message: `Вопрос ${questionNumber}. Вопросы и варианты ответов должны быть уникальными`
        })

        questionNumber++
    }

    return {questions, errors}
}

export default questionValidation