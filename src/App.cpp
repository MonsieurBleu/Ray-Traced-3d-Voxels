#include <App.hpp>
#include <Utils.hpp>

//https://antongerdelan.net/opengl/hellotriangle.html

App::App(GLFWwindow* window) : window(window)
{
    timestart = Get_time_ms();
}

void App::mainInput()
{
    if(glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        state = quit;
}


void App::mainloop()
{   
    /// CENTER WINDOW
    GLFWmonitor* monitor = glfwGetPrimaryMonitor();
    const GLFWvidmode* mode = glfwGetVideoMode(monitor);
    glfwSetWindowPos(window, (mode->width - 1920) / 2, (mode->height - 1080) / 2);


    /// CREATINHG QUAD TO COVER ALL THE SCREEN
    float points[] = {
    -1.0f,  1.0f,  0.0f,
    1.0f, 1.0f,  0.0f,
    -1.0f, -1.0f,  0.0f,
    
    1.0f,  -1.0f,  0.0f,
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


    /// CREATING A SHADER PROGRAM
    // ShaderProgram test("shader/test.frag", "shader/test.vert", "");
    ShaderProgram test("shader/RTvox.frag", "shader/test.vert", "");

    test.activate();

    int winsize[2] = {1920, 1080};
    glUniform2iv(0, 1, winsize);


    /// CREATING AN SSBO
    int *shader_data = new int[0xFFFFFF];
    // int shader_data[0xFFFFFF] = {50};
    for(int i = 0; i < 16; i++)
        shader_data[i] = 50;
    
    shader_data[0xFFFFFF -1] = 69;

    GLuint ssbo = 0;
    glGenBuffers(1, &ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
    glBufferData(GL_SHADER_STORAGE_BUFFER, sizeof(int)*0xFFFFFF, shader_data, GL_DYNAMIC_COPY);
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 2, ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER, 0);

    // glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
    // GLvoid* p = glMapBuffer(GL_SHADER_STORAGE_BUFFER, GL_WRITE_ONLY);
    // memcpy(p, &shader_data, sizeof(shader_data))
    // glUnmapBuffer(GL_SHADER_STORAGE_BUFFER);

    // GLuint block_index = 0;
    // block_index = glGetProgramResourceIndex(test.get_program(), GL_SHADER_STORAGE_BLOCK, "shader_data");
    // GLuint ssbo_binding_point_index = 2;
    // glShaderStorageBlockBinding(test.get_program(), block_index, ssbo_binding_point_index);


    /// MAIN LOOP
    while(state != quit)
    {
        mainInput();

        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        
        test.activate();
        glBindVertexArray(vao);
        // draw points 0-3 from the currently bound VAO with current in-use shader
        glDrawArrays(GL_TRIANGLES, 0, 6);

        glUniform1f(1, (Get_time_ms()-timestart)*1.0/1000.0);

        glfwPollEvents();
        glfwSwapBuffers(window);
    }

    delete shader_data;
}