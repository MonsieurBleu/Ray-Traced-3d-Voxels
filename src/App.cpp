#include <App.hpp>
#include <Utils.hpp>

//https://antongerdelan.net/opengl/hellotriangle.html

App::App(GLFWwindow* window) : window(window)
{

}

void App::mainInput()
{
    if(glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        state = quit;
}


void App::mainloop()
{   
    Shader test;
    test.load_from_file("shader/test.frag");
    test.load_from_file("shader/test.vert");

    while(state != quit)
    {
        mainInput();

        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        
        glfwPollEvents();
        glfwSwapBuffers(window);
    }
}