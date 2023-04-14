#ifndef APP_HPP
#define APP_HPP

#include <iostream>
#include <Shader.hpp>

enum AppState
{
    quit,
    run // default state for tests
};

class App
{
    private :
        AppState state = run;
        GLFWwindow* window;


        void mainInput();

    public :
        App(GLFWwindow* window);
        void mainloop();

};


#endif