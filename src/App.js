import { useEffect, useReducer } from "react"
import Header from "./components/Header"
import Main from "./components/Main"
import Loader from "./components/Loader"
import Error from "./components/Error"
import StartScreen from "./components/StartScreen"
import Question from "./components/Question"
import NextBtn from "./components/NextBtn"
import Progress from "./components/Progress"
import FinishScreen from "./components/FinishScreen"
import Footer from "./components/Footer"
import Timer from "./components/Timer"

const secondsPerQuestion = 30
const initialState = {
  questions: [],

  //loading, error, ready, active, finished
  status: "loading",
  index: 0,
  answer: null,
  points: 0,
  secondsRemaining: null,
}

const reducer = (state, action) => {
  switch (action.type) {
    case "dataReceived":
      return { ...state, questions: action.payload, status: "ready" }
    case "dataFailed":
      return { ...state, sratus: "error" }
    case "start":
      return {
        ...state,
        status: "active",
        secondsRemaining: state.questions.length * secondsPerQuestion,
      }
    case "newAnswer":
      const question = state.questions.at(state.index)
      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      }
    case "nextQuestion":
      return { ...state, index: state.index + 1, answer: null }
    case "finish":
      return { ...state, status: "finished" }
    case "restart":
      return { ...initialState, questions: state.questions, status: "ready" }
    case "tick":
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? "finished" : state.status,
      }

    default:
      throw new Error(`Action is unknown`)
  }
}

const App = () => {
  const [
    { questions, status, index, answer, points, secondsRemaining },
    dispatch,
  ] = useReducer(reducer, initialState)

  const numQuestions = questions.length
  const totalPoints = questions.reduce((acc, value) => acc + value.points, 0)

  useEffect(() => {
    const getQuestions = async () => {
      try {
        const res = await fetch(`http://localhost:9000/questions`)

        const data = await res.json()
        dispatch({ type: "dataReceived", payload: data })
      } catch (err) {
        dispatch({ type: "dataFailed" })
      }
    }

    getQuestions()
  }, [])

  return (
    <div className="app">
      <Header />

      <Main className="main">
        {status === "loading" && <Loader />}
        {status === "error" && <Error />}
        {status === "ready" && (
          <StartScreen numQuestions={numQuestions} dispatch={dispatch} />
        )}
        {status === "active" && (
          <>
            <Progress
              index={index}
              numQuestions={numQuestions}
              points={points}
              totalPoints={totalPoints}
              answer={answer}
            />
            <Question
              question={questions[index]}
              dispatch={dispatch}
              answer={answer}
            />

            <Footer>
              <Timer dispatch={dispatch} secondsRemaining={secondsRemaining} />
              <NextBtn
                dispatch={dispatch}
                answer={answer}
                numQuestions={numQuestions}
                index={index}
              />
            </Footer>
          </>
        )}

        {status === "finished" && (
          <>
            <FinishScreen
              points={points}
              totalPoints={totalPoints}
              dispatch={dispatch}
            />
          </>
        )}
      </Main>
    </div>
  )
}

export default App
