#ifndef CAMERA_HPP
#define CAMERA_HPP

#include <GL/glew.h>
#define GLFW_DLL
#include <GLFW/glfw3.h>

#include <Utils.hpp>
#include <Vectors.hpp>

// float th = mouseUV.y*PI; // polar theta of direction
// float ph = mouseUV.x*PI; // polar phi of direaction
// dir = vec3(sin(th)*cos(ph), cos(th), sin(th)*sin(ph));

class Camera
{
    private :

        GLFWwindow ** const window;

        bool mouse_follow = true;

        vec3<double> Mouse_uv = vec3<double>(0.0, 0.0, 1.5);
        vec3<float> position = vec3<float>(0.f);
        vec3<float> direction = vec3<float>(1.f, 0.f, 0.f);
        float polar_direction[2] = {0.f, 0.f};

        float FOV = 1.5;
        float sensibility = 2.0;

        uint64_t time_since_last_movement;

    public :
        
        Camera(GLFWwindow ** const window) : window(window) {time_since_last_movement = Get_time_ms();};

        const vec3<double>* get_Mouse_uv()           {return &Mouse_uv;};
        const vec3<float>*  get_position()           {return &position;};
        const vec3<float>*  get_direction()          {return &direction;};
        const vec3<float>*  get_updated_direction()  {update_direction(); return &direction;};
        const float*        get_polar_direciton()    {return polar_direction;}
        float get_FOV()                              {return FOV;};
        float get_sensibility()                      {return sensibility;};

        void add_FOV(float f){FOV += f;};

        // Update the camera direction depending on mouse position onscreen
        void update_direction();

        // Apply given velocity to the camera position
        // velocity is expressed in unit/s
        void move(vec3<float> velocity);

        // Teleport the camera to the given position
        void teleport(vec3<float> newpos);

        bool toggle_mouse_follow() {return mouse_follow = !mouse_follow;};
};


#endif