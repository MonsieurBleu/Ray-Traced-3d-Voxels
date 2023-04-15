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
    float points[] = {
    1.0f,  -1.0f,  0.0f,
    1.0f, 1.0f,  0.0f,
    -1.0f, -1.0f,  0.0f,
    -1.0f,  1.0f,  0.0f,
    1.0f, 1.0f,  0.0f,
    -1.0f, -1.0f,  0.0f,
    };

    GLuint vbo = 0;
    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, 2 * 9 * sizeof(float), points, GL_STATIC_DRAW);



    GLuint vao = 0;
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);
    glEnableVertexAttribArray(0);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, NULL);

    ShaderProgram test("shader/test.frag", "shader/test.vert", "");

    test.activate();

    while(state != quit)
    {
        mainInput();

        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        
        test.activate();
        glBindVertexArray(vao);
        // draw points 0-3 from the currently bound VAO with current in-use shader
        glDrawArrays(GL_TRIANGLES, 0, 3);

        

        glfwPollEvents();
        glfwSwapBuffers(window);
    }
}