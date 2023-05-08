#include <App.hpp>
#include <Utils.hpp>
#include <Octree.hpp>
#include <string.h> // for memset


//https://antongerdelan.net/opengl/hellotriangle.html

App::App(GLFWwindow* window) : window(window), camera(&window)
{
    timestart = Get_time_ms();
}

void App::mainInput()
{
    if(glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        state = quit;
    
    float camspeed = 15.0;
    if(glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS)
        camspeed *= 10.0;

    vec3<float> velocity(0.0);

    if(glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
    {
        velocity.x += camspeed;
    }
    if(glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
    {
        velocity.x -= camspeed;
    }
    if(glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
    {
        velocity.z -= camspeed;
    }
    if(glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
    {
        velocity.z += camspeed;
    }
    if(glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS)
    {
        velocity.y += camspeed;
    }
    if(glfwGetKey(window, GLFW_KEY_LEFT_CONTROL) == GLFW_PRESS)
    {
        velocity.y -= camspeed;
    }

    camera.move(velocity);

    if(glfwGetKey(window, GLFW_KEY_KP_ADD) == GLFW_PRESS)
    {
        camera.add_FOV(-0.1);
    }

    if(glfwGetKey(window, GLFW_KEY_KP_SUBTRACT) == GLFW_PRESS)
    {
        camera.add_FOV(0.1);
    }

    if(glfwGetKey(window, GLFW_KEY_KP_SUBTRACT) == GLFW_PRESS)
    {
        // glBufferSubData(GL_SHADER_STORAGE_BUFFER, offset, size, data); //to update partially
    }

    if(glfwGetKey(window, GLFW_KEY_F1) == GLFW_PRESS)
    {
        camera.toggle_mouse_follow();
    }   
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

    World[0].lod_surface.color.r = 255;
    World.send_to_gpu();

    int height = 512;

    World.draw_volume({200, 150, 50, LEAF_LIMIT8}, vec3<int>(0, 0, 0),   vec3<int>(512, height, 512));

    World.draw_volume({50, 150, 200, LEAF_LIMIT8}, vec3<int>(512, 0, 0), vec3<int>(768, height, 256));

    World.draw_volume({50, 200, 150, LEAF_LIMIT8}, vec3<int>(768, 0, 0), vec3<int>(896, height, 128));

    World.draw_volume({200, 50, 150, LEAF_LIMIT8}, vec3<int>(896, 0, 0), vec3<int>(960, height, 64));

    World.draw_volume({200, 50, 150, LEAF_LIMIT8}, vec3<int>(960, 0, 0), vec3<int>(992, height, 32));

    World.draw_volume({150, 50, 200, LEAF_LIMIT8}, vec3<int>(992, 0, 0), vec3<int>(1008, height, 16));

    World.draw_volume({150, 200, 50, LEAF_LIMIT8}, vec3<int>(1008, 0, 0), vec3<int>(1016, height, 8));

    World.draw_volume({200, 200, 200, LEAF_LIMIT8}, vec3<int>(0, 0, 0), vec3<int>(1024, height, 4));

    World.send_update();

    /// MAIN LOOP
    while(state != quit)
    {
        glfwPollEvents();

        if(glfwGetKey(window, GLFW_KEY_F5) == GLFW_PRESS)
        {
            system("cls");
            glDeleteProgram(test.get_program());
            test.CompileAndLink();
            test.activate();
            int winsize[2] = {1920, 1080};
            glUniform2iv(0, 1, winsize);
        }

        mainInput();

        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        
        test.activate();
        glBindVertexArray(vao);

        glUniform1f(1, (Get_time_ms()-timestart)*1.0/1000.0);
        glUniform3fv(2, 1, (const GLfloat *)camera.get_position());
        glUniform3fv(3, 1, (const GLfloat *)camera.get_updated_direction());
        glUniform2fv(4, 1, (const GLfloat *)camera.get_polar_direciton());
        glUniform1f(5, camera.get_FOV());
        // std::cout << mouse[0] << "\t" << mouse[1] << "\n";

        // draw points 0-3 from the currently bound VAO with current in-use shader
        glDrawArrays(GL_TRIANGLES, 0, 6);

        glfwSwapBuffers(window);
    }
}