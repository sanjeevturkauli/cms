import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\RolePermissionController::permissions
 * @see app/Http/Controllers/RolePermissionController.php:203
 * @route '/admin/permissions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/permissions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RolePermissionController::permissions
 * @see app/Http/Controllers/RolePermissionController.php:203
 * @route '/admin/permissions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RolePermissionController::permissions
 * @see app/Http/Controllers/RolePermissionController.php:203
 * @route '/admin/permissions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RolePermissionController::permissions
 * @see app/Http/Controllers/RolePermissionController.php:203
 * @route '/admin/permissions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RolePermissionController::permissions
 * @see app/Http/Controllers/RolePermissionController.php:203
 * @route '/admin/permissions'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RolePermissionController::permissions
 * @see app/Http/Controllers/RolePermissionController.php:203
 * @route '/admin/permissions'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RolePermissionController::permissions
 * @see app/Http/Controllers/RolePermissionController.php:203
 * @route '/admin/permissions'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm