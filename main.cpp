// #include <iostream>
// #include <GL/glew.h>
// #define GLFW_DLL
// #include <GLFW/glfw3.h>

#include <App.hpp>

int main()
{
    system("cls");
    std::cout << "#### RAY TRACED VOXELS ####\n";

    // start GL context and O/S window using the GLFW helper library
    if (!glfwInit())
    {
        std::cerr << "ERROR: could not start GLFW3\n";
        return 1;
    } 

    // uncomment these lines if on Apple OS X
    /*glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 2);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);*/

    GLFWwindow* window = glfwCreateWindow(640, 480, "Hello Triangle", NULL, NULL);
    if (!window) {
    std::cerr << "ERROR: could not open window with GLFW3\n";
    glfwTerminate();
    return 1;
    }
    glfwMakeContextCurrent(window);
                                    
    // start GLEW extension handler
    glewExperimental = GL_TRUE;
    glewInit();

    // get version info
    const GLubyte* renderer = glGetString(GL_RENDERER); // get renderer string
    const GLubyte* version = glGetString(GL_VERSION); // version as a string
    std::cout << "Renderer: " << renderer << "\n";
    std::cout << "OpenGL version supported " << version << "\n";

    // tell GL to only draw onto a pixel if the shape is closer to the viewer
    glEnable(GL_DEPTH_TEST); // enable depth-testing
    glDepthFunc(GL_LESS); // depth-testing interprets a smaller value as "closer"

    /* OTHER STUFF GOES HERE NEXT */
    int tmp;
    std::cin >> tmp;

    App RTVoxl;
    RTVoxl.mainloop();

    // close GL context and any other GLFW resources
    glfwTerminate();

    return EXIT_SUCCESS;
}